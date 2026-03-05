using System.Text.Json;
using Application.Common;
using Application.DTOs.Common;
using Application.DTOs.Surveys;
using Application.Interfaces;
using Domain.Entities;
using Domain.Enums;
using Domain.Interfaces;
using Microsoft.EntityFrameworkCore;
using OfficeOpenXml;

namespace Application.Services;

public class SurveyService : ISurveyService
{
    private readonly IUnitOfWork _unitOfWork;

    public SurveyService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    // ───── Surveys CRUD ─────

    public async Task<PagedResult<SurveyDto>> GetSurveysAsync(SurveyFilterDto filter)
    {
        var query = _unitOfWork.Surveys.AsQueryable()
            .Include(s => s.Cycle)
            .Include(s => s.Questions)
            .Include(s => s.Responses)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.ToLower();
            query = query.Where(s => s.Title.ToLower().Contains(search) ||
                                     (s.TitleLocal != null && s.TitleLocal.ToLower().Contains(search)));
        }

        if (filter.Status.HasValue)
            query = query.Where(s => s.Status == filter.Status.Value);

        if (filter.CycleId.HasValue)
            query = query.Where(s => s.CycleId == filter.CycleId.Value);

        var totalCount = await query.CountAsync();

        query = (filter.SortBy?.ToLower()) switch
        {
            "title" => filter.SortDirection == "desc" ? query.OrderByDescending(s => s.Title) : query.OrderBy(s => s.Title),
            "status" => filter.SortDirection == "desc" ? query.OrderByDescending(s => s.Status) : query.OrderBy(s => s.Status),
            "createdat" => filter.SortDirection == "desc" ? query.OrderByDescending(s => s.CreatedAt) : query.OrderBy(s => s.CreatedAt),
            _ => query.OrderByDescending(s => s.CreatedAt)
        };

        var items = await query
            .Skip((filter.Page - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(s => new SurveyDto
            {
                Id = s.Id,
                Title = s.Title,
                TitleLocal = s.TitleLocal,
                Description = s.Description,
                CycleId = s.CycleId,
                CycleName = s.Cycle != null ? s.Cycle.Name : null,
                Status = s.Status,
                IsAnonymous = s.IsAnonymous,
                StartsAt = s.StartsAt,
                ExpiresAt = s.ExpiresAt,
                QuestionCount = s.Questions.Count(q => !q.IsDeleted),
                ResponseCount = s.Responses.Count(r => !r.IsDeleted),
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        return new PagedResult<SurveyDto>
        {
            Items = items,
            Page = filter.Page,
            PageSize = filter.PageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<SurveyDetailDto?> GetSurveyByIdAsync(int id)
    {
        var survey = await _unitOfWork.Surveys.AsQueryable()
            .Include(s => s.Cycle)
            .Include(s => s.Questions.Where(q => !q.IsDeleted).OrderBy(q => q.SortOrder))
            .Include(s => s.Responses.Where(r => !r.IsDeleted))
            .FirstOrDefaultAsync(s => s.Id == id);

        if (survey == null) return null;

        return new SurveyDetailDto
        {
            Id = survey.Id,
            Title = survey.Title,
            TitleLocal = survey.TitleLocal,
            Description = survey.Description,
            CycleId = survey.CycleId,
            CycleName = survey.Cycle?.Name,
            Status = survey.Status,
            IsAnonymous = survey.IsAnonymous,
            StartsAt = survey.StartsAt,
            ExpiresAt = survey.ExpiresAt,
            QuestionCount = survey.Questions.Count,
            ResponseCount = survey.Responses.Count,
            CreatedAt = survey.CreatedAt,
            Questions = survey.Questions.Select(MapQuestionToDto).ToList()
        };
    }

    public async Task<SurveyDto> CreateSurveyAsync(CreateSurveyRequest request)
    {
        var survey = new Survey
        {
            Title = request.Title,
            TitleLocal = request.TitleLocal,
            Description = request.Description,
            CycleId = request.CycleId,
            IsAnonymous = request.IsAnonymous,
            StartsAt = request.StartsAt,
            ExpiresAt = request.ExpiresAt,
            Status = SurveyStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var q in request.Questions)
        {
            survey.Questions.Add(new SurveyQuestion
            {
                QuestionType = q.QuestionType,
                QuestionText = q.QuestionText,
                QuestionTextLocal = q.QuestionTextLocal,
                Options = q.Options != null ? JsonSerializer.Serialize(q.Options) : null,
                IsRequired = q.IsRequired,
                SortOrder = q.SortOrder,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.Surveys.AddAsync(survey);
        await _unitOfWork.SaveChangesAsync();

        return await MapSurveyToDto(survey);
    }

    public async Task<SurveyDto> UpdateSurveyAsync(UpdateSurveyRequest request)
    {
        var survey = await _unitOfWork.Surveys.AsQueryable()
            .Include(s => s.Questions)
            .FirstOrDefaultAsync(s => s.Id == request.Id)
            ?? throw new KeyNotFoundException($"Survey {request.Id} not found");

        survey.Title = request.Title;
        survey.TitleLocal = request.TitleLocal;
        survey.Description = request.Description;
        survey.CycleId = request.CycleId;
        survey.IsAnonymous = request.IsAnonymous;
        survey.StartsAt = request.StartsAt;
        survey.ExpiresAt = request.ExpiresAt;
        survey.UpdatedAt = DateTime.UtcNow;

        // Replace questions
        foreach (var existing in survey.Questions.Where(q => !q.IsDeleted))
        {
            existing.IsDeleted = true;
        }

        foreach (var q in request.Questions)
        {
            survey.Questions.Add(new SurveyQuestion
            {
                QuestionType = q.QuestionType,
                QuestionText = q.QuestionText,
                QuestionTextLocal = q.QuestionTextLocal,
                Options = q.Options != null ? JsonSerializer.Serialize(q.Options) : null,
                IsRequired = q.IsRequired,
                SortOrder = q.SortOrder,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.Surveys.UpdateAsync(survey);
        await _unitOfWork.SaveChangesAsync();

        return await MapSurveyToDto(survey);
    }

    public async Task UpdateSurveyStatusAsync(int id, UpdateSurveyStatusRequest request)
    {
        var survey = await _unitOfWork.Surveys.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Survey {id} not found");

        survey.Status = request.Status;
        survey.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Surveys.UpdateAsync(survey);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task DeleteSurveyAsync(int id)
    {
        var survey = await _unitOfWork.Surveys.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Survey {id} not found");

        survey.IsDeleted = true;
        survey.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.Surveys.UpdateAsync(survey);
        await _unitOfWork.SaveChangesAsync();
    }

    // ───── Questions ─────

    public async Task<SurveyQuestionDto> AddQuestionAsync(int surveyId, CreateSurveyQuestionRequest request)
    {
        _ = await _unitOfWork.Surveys.GetByIdAsync(surveyId)
            ?? throw new KeyNotFoundException($"Survey {surveyId} not found");

        var question = new SurveyQuestion
        {
            SurveyId = surveyId,
            QuestionType = request.QuestionType,
            QuestionText = request.QuestionText,
            QuestionTextLocal = request.QuestionTextLocal,
            Options = request.Options != null ? JsonSerializer.Serialize(request.Options) : null,
            IsRequired = request.IsRequired,
            SortOrder = request.SortOrder,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.SurveyQuestions.AddAsync(question);
        await _unitOfWork.SaveChangesAsync();

        return MapQuestionToDto(question);
    }

    public async Task<SurveyQuestionDto> UpdateQuestionAsync(int surveyId, int questionId, CreateSurveyQuestionRequest request)
    {
        var question = await _unitOfWork.SurveyQuestions.AsQueryable()
            .FirstOrDefaultAsync(q => q.Id == questionId && q.SurveyId == surveyId)
            ?? throw new KeyNotFoundException($"Question {questionId} not found in survey {surveyId}");

        question.QuestionType = request.QuestionType;
        question.QuestionText = request.QuestionText;
        question.QuestionTextLocal = request.QuestionTextLocal;
        question.Options = request.Options != null ? JsonSerializer.Serialize(request.Options) : null;
        question.IsRequired = request.IsRequired;
        question.SortOrder = request.SortOrder;
        question.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SurveyQuestions.UpdateAsync(question);
        await _unitOfWork.SaveChangesAsync();

        return MapQuestionToDto(question);
    }

    public async Task DeleteQuestionAsync(int surveyId, int questionId)
    {
        var question = await _unitOfWork.SurveyQuestions.AsQueryable()
            .FirstOrDefaultAsync(q => q.Id == questionId && q.SurveyId == surveyId)
            ?? throw new KeyNotFoundException($"Question {questionId} not found in survey {surveyId}");

        question.IsDeleted = true;
        question.UpdatedAt = DateTime.UtcNow;
        await _unitOfWork.SurveyQuestions.UpdateAsync(question);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task ReorderQuestionsAsync(int surveyId, List<int> questionIds)
    {
        var questions = await _unitOfWork.SurveyQuestions.AsQueryable()
            .Where(q => q.SurveyId == surveyId && questionIds.Contains(q.Id))
            .ToListAsync();

        for (var i = 0; i < questionIds.Count; i++)
        {
            var q = questions.FirstOrDefault(x => x.Id == questionIds[i]);
            if (q != null)
            {
                q.SortOrder = i;
                q.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _unitOfWork.SaveChangesAsync();
    }

    // ───── Responses ─────

    public async Task<SurveyResponseDto> SubmitResponseAsync(SubmitSurveyResponseRequest request)
    {
        var survey = await _unitOfWork.Surveys.AsQueryable()
            .Include(s => s.Questions.Where(q => !q.IsDeleted))
            .FirstOrDefaultAsync(s => s.Id == request.SurveyId)
            ?? throw new KeyNotFoundException($"Survey {request.SurveyId} not found");

        if (survey.Status != SurveyStatus.Active)
            throw new InvalidOperationException("Survey is not active");

        var response = new SurveyResponse
        {
            SurveyId = request.SurveyId,
            RespondentRepId = request.RespondentRepId,
            CustomerId = request.CustomerId,
            VisitId = request.VisitId,
            CompletedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var a in request.Answers)
        {
            response.Answers.Add(new SurveyAnswer
            {
                QuestionId = a.QuestionId,
                AnswerValue = a.AnswerValue,
                SelectedOptions = a.SelectedOptions != null ? JsonSerializer.Serialize(a.SelectedOptions) : null,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _unitOfWork.SurveyResponses.AddAsync(response);
        await _unitOfWork.SaveChangesAsync();

        return await MapResponseToDto(response);
    }

    public async Task<PagedResult<SurveyResponseDto>> GetResponsesAsync(int surveyId, int page = 1, int pageSize = 10)
    {
        var query = _unitOfWork.SurveyResponses.AsQueryable()
            .Include(r => r.RespondentRep).ThenInclude(r => r.User)
            .Include(r => r.Customer)
            .Include(r => r.Answers).ThenInclude(a => a.Question)
            .Where(r => r.SurveyId == surveyId)
            .OrderByDescending(r => r.CompletedAt);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<SurveyResponseDto>
        {
            Items = items.Select(r => new SurveyResponseDto
            {
                Id = r.Id,
                SurveyId = r.SurveyId,
                SurveyTitle = string.Empty,
                RespondentRepId = r.RespondentRepId,
                RepName = r.RespondentRep?.User?.FullName ?? "Unknown",
                CustomerId = r.CustomerId,
                CustomerName = r.Customer?.FullName ?? "Unknown",
                VisitId = r.VisitId,
                CompletedAt = r.CompletedAt,
                Answers = r.Answers.Where(a => !a.IsDeleted).Select(a => new SurveyAnswerDto
                {
                    Id = a.Id,
                    QuestionId = a.QuestionId,
                    QuestionText = a.Question?.QuestionText ?? "",
                    QuestionType = a.Question?.QuestionType ?? QuestionType.Text,
                    AnswerValue = a.AnswerValue,
                    SelectedOptions = !string.IsNullOrEmpty(a.SelectedOptions)
                        ? JsonSerializer.Deserialize<List<string>>(a.SelectedOptions)
                        : null
                }).ToList()
            }).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
        };
    }

    public async Task<SurveyResponseDto?> GetResponseByIdAsync(int responseId)
    {
        var r = await _unitOfWork.SurveyResponses.AsQueryable()
            .Include(r => r.Survey)
            .Include(r => r.RespondentRep).ThenInclude(r => r.User)
            .Include(r => r.Customer)
            .Include(r => r.Answers).ThenInclude(a => a.Question)
            .FirstOrDefaultAsync(r => r.Id == responseId);

        if (r == null) return null;

        return new SurveyResponseDto
        {
            Id = r.Id,
            SurveyId = r.SurveyId,
            SurveyTitle = r.Survey?.Title ?? "",
            RespondentRepId = r.RespondentRepId,
            RepName = r.RespondentRep?.User?.FullName ?? "Unknown",
            CustomerId = r.CustomerId,
            CustomerName = r.Customer?.FullName ?? "Unknown",
            VisitId = r.VisitId,
            CompletedAt = r.CompletedAt,
            Answers = r.Answers.Where(a => !a.IsDeleted).Select(a => new SurveyAnswerDto
            {
                Id = a.Id,
                QuestionId = a.QuestionId,
                QuestionText = a.Question?.QuestionText ?? "",
                QuestionType = a.Question?.QuestionType ?? QuestionType.Text,
                AnswerValue = a.AnswerValue,
                SelectedOptions = !string.IsNullOrEmpty(a.SelectedOptions)
                    ? JsonSerializer.Deserialize<List<string>>(a.SelectedOptions)
                    : null
            }).ToList()
        };
    }

    // ───── Analytics ─────

    public async Task<SurveyAnalyticsDto> GetSurveyAnalyticsAsync(int surveyId)
    {
        var survey = await _unitOfWork.Surveys.AsQueryable()
            .Include(s => s.Questions.Where(q => !q.IsDeleted).OrderBy(q => q.SortOrder))
            .FirstOrDefaultAsync(s => s.Id == surveyId)
            ?? throw new KeyNotFoundException($"Survey {surveyId} not found");

        var responses = await _unitOfWork.SurveyResponses.AsQueryable()
            .Include(r => r.Answers).ThenInclude(a => a.Question)
            .Where(r => r.SurveyId == surveyId)
            .ToListAsync();

        var allAnswers = responses.SelectMany(r => r.Answers.Where(a => !a.IsDeleted)).ToList();

        var questionAnalytics = survey.Questions.Select(q =>
        {
            var answers = allAnswers.Where(a => a.QuestionId == q.Id).ToList();
            var analytics = new QuestionAnalyticsDto
            {
                QuestionId = q.Id,
                QuestionText = q.QuestionText,
                QuestionType = q.QuestionType,
                AnswerCount = answers.Count
            };

            switch (q.QuestionType)
            {
                case QuestionType.Rating:
                case QuestionType.Number:
                    var numericValues = answers
                        .Where(a => double.TryParse(a.AnswerValue, out _))
                        .Select(a => double.Parse(a.AnswerValue!))
                        .ToList();
                    analytics = analytics with { AverageRating = numericValues.Count != 0 ? numericValues.Average() : null };
                    break;

                case QuestionType.SingleChoice:
                case QuestionType.MultiChoice:
                    var distribution = new Dictionary<string, int>();
                    foreach (var a in answers)
                    {
                        List<string>? selected = null;
                        if (!string.IsNullOrEmpty(a.SelectedOptions))
                            selected = JsonSerializer.Deserialize<List<string>>(a.SelectedOptions);
                        else if (!string.IsNullOrEmpty(a.AnswerValue))
                            selected = new List<string> { a.AnswerValue };

                        if (selected != null)
                        {
                            foreach (var opt in selected)
                            {
                                distribution.TryGetValue(opt, out var count);
                                distribution[opt] = count + 1;
                            }
                        }
                    }
                    analytics = analytics with { OptionDistribution = distribution };
                    break;

                case QuestionType.Text:
                    analytics = analytics with
                    {
                        TextResponses = answers
                            .Where(a => !string.IsNullOrEmpty(a.AnswerValue))
                            .Select(a => a.AnswerValue!)
                            .Take(50)
                            .ToList()
                    };
                    break;

                case QuestionType.YesNo:
                    var yesNo = new Dictionary<string, int> { { "Yes", 0 }, { "No", 0 } };
                    foreach (var a in answers)
                    {
                        if (a.AnswerValue?.Equals("true", StringComparison.OrdinalIgnoreCase) == true ||
                            a.AnswerValue?.Equals("yes", StringComparison.OrdinalIgnoreCase) == true)
                            yesNo["Yes"]++;
                        else
                            yesNo["No"]++;
                    }
                    analytics = analytics with { OptionDistribution = yesNo };
                    break;
            }

            return analytics;
        }).ToList();

        return new SurveyAnalyticsDto
        {
            SurveyId = surveyId,
            SurveyTitle = survey.Title,
            TotalResponses = responses.Count,
            QuestionAnalytics = questionAnalytics
        };
    }

    public async Task<byte[]> ExportSurveyResultsAsync(int surveyId)
    {
        ExcelPackage.LicenseContext = OfficeOpenXml.LicenseContext.NonCommercial;

        var survey = await _unitOfWork.Surveys.AsQueryable()
            .Include(s => s.Questions.Where(q => !q.IsDeleted).OrderBy(q => q.SortOrder))
            .FirstOrDefaultAsync(s => s.Id == surveyId)
            ?? throw new KeyNotFoundException($"Survey {surveyId} not found");

        var responses = await _unitOfWork.SurveyResponses.AsQueryable()
            .Include(r => r.RespondentRep).ThenInclude(r => r.User)
            .Include(r => r.Customer)
            .Include(r => r.Answers)
            .Where(r => r.SurveyId == surveyId)
            .OrderBy(r => r.CompletedAt)
            .ToListAsync();

        using var package = new ExcelPackage();
        var ws = package.Workbook.Worksheets.Add(survey.Title[..Math.Min(survey.Title.Length, 31)]);

        // Headers
        ws.Cells[1, 1].Value = "Rep";
        ws.Cells[1, 2].Value = "Customer";
        ws.Cells[1, 3].Value = "Completed At";
        var col = 4;
        foreach (var q in survey.Questions)
        {
            ws.Cells[1, col].Value = q.QuestionText;
            col++;
        }

        // Data rows
        var row = 2;
        foreach (var r in responses)
        {
            ws.Cells[row, 1].Value = r.RespondentRep?.User?.FullName ?? "Unknown";
            ws.Cells[row, 2].Value = r.Customer?.FullName ?? "Unknown";
            ws.Cells[row, 3].Value = r.CompletedAt.ToString("yyyy-MM-dd HH:mm");

            col = 4;
            foreach (var q in survey.Questions)
            {
                var answer = r.Answers.FirstOrDefault(a => a.QuestionId == q.Id);
                if (answer != null)
                {
                    if (!string.IsNullOrEmpty(answer.SelectedOptions))
                    {
                        var selected = JsonSerializer.Deserialize<List<string>>(answer.SelectedOptions);
                        ws.Cells[row, col].Value = selected != null ? string.Join(", ", selected) : "";
                    }
                    else
                    {
                        ws.Cells[row, col].Value = answer.AnswerValue ?? "";
                    }
                }
                col++;
            }
            row++;
        }

        // Auto-fit
        ws.Cells[ws.Dimension.Address].AutoFitColumns();

        return package.GetAsByteArray();
    }

    // ───── Helpers ─────

    private SurveyQuestionDto MapQuestionToDto(SurveyQuestion q)
    {
        return new SurveyQuestionDto
        {
            Id = q.Id,
            SurveyId = q.SurveyId,
            QuestionType = q.QuestionType,
            QuestionText = q.QuestionText,
            QuestionTextLocal = q.QuestionTextLocal,
            Options = !string.IsNullOrEmpty(q.Options)
                ? JsonSerializer.Deserialize<List<string>>(q.Options)
                : null,
            IsRequired = q.IsRequired,
            SortOrder = q.SortOrder
        };
    }

    private async Task<SurveyDto> MapSurveyToDto(Survey survey)
    {
        var fresh = await _unitOfWork.Surveys.AsQueryable()
            .Include(s => s.Cycle)
            .Include(s => s.Questions)
            .Include(s => s.Responses)
            .FirstOrDefaultAsync(s => s.Id == survey.Id);

        var s = fresh ?? survey;

        return new SurveyDto
        {
            Id = s.Id,
            Title = s.Title,
            TitleLocal = s.TitleLocal,
            Description = s.Description,
            CycleId = s.CycleId,
            CycleName = s.Cycle?.Name,
            Status = s.Status,
            IsAnonymous = s.IsAnonymous,
            StartsAt = s.StartsAt,
            ExpiresAt = s.ExpiresAt,
            QuestionCount = s.Questions.Count(q => !q.IsDeleted),
            ResponseCount = s.Responses.Count(r => !r.IsDeleted),
            CreatedAt = s.CreatedAt
        };
    }

    private async Task<SurveyResponseDto> MapResponseToDto(SurveyResponse response)
    {
        var r = await _unitOfWork.SurveyResponses.AsQueryable()
            .Include(r => r.Survey)
            .Include(r => r.RespondentRep).ThenInclude(r => r.User)
            .Include(r => r.Customer)
            .Include(r => r.Answers).ThenInclude(a => a.Question)
            .FirstOrDefaultAsync(r => r.Id == response.Id);

        if (r == null) return new SurveyResponseDto { Id = response.Id };

        return new SurveyResponseDto
        {
            Id = r.Id,
            SurveyId = r.SurveyId,
            SurveyTitle = r.Survey?.Title ?? "",
            RespondentRepId = r.RespondentRepId,
            RepName = r.RespondentRep?.User?.FullName ?? "Unknown",
            CustomerId = r.CustomerId,
            CustomerName = r.Customer?.FullName ?? "Unknown",
            VisitId = r.VisitId,
            CompletedAt = r.CompletedAt,
            Answers = r.Answers.Where(a => !a.IsDeleted).Select(a => new SurveyAnswerDto
            {
                Id = a.Id,
                QuestionId = a.QuestionId,
                QuestionText = a.Question?.QuestionText ?? "",
                QuestionType = a.Question?.QuestionType ?? QuestionType.Text,
                AnswerValue = a.AnswerValue,
                SelectedOptions = !string.IsNullOrEmpty(a.SelectedOptions)
                    ? JsonSerializer.Deserialize<List<string>>(a.SelectedOptions)
                    : null
            }).ToList()
        };
    }
}
