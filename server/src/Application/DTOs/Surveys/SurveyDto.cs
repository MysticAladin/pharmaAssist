using Domain.Enums;

namespace Application.DTOs.Surveys;

// ───── Survey DTOs ─────

public record SurveyDto
{
    public int Id { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? TitleLocal { get; init; }
    public string? Description { get; init; }
    public int? CycleId { get; init; }
    public string? CycleName { get; init; }
    public SurveyStatus Status { get; init; }
    public string StatusName => Status.ToString();
    public bool IsAnonymous { get; init; }
    public DateTime? StartsAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public int QuestionCount { get; init; }
    public int ResponseCount { get; init; }
    public DateTime CreatedAt { get; init; }
}

public record SurveyDetailDto : SurveyDto
{
    public List<SurveyQuestionDto> Questions { get; init; } = new();
}

public record SurveyQuestionDto
{
    public int Id { get; init; }
    public int SurveyId { get; init; }
    public QuestionType QuestionType { get; init; }
    public string QuestionTypeName => QuestionType.ToString();
    public string QuestionText { get; init; } = string.Empty;
    public string? QuestionTextLocal { get; init; }
    public List<string>? Options { get; init; }
    public bool IsRequired { get; init; }
    public int SortOrder { get; init; }
}

public record CreateSurveyRequest
{
    public string Title { get; init; } = string.Empty;
    public string? TitleLocal { get; init; }
    public string? Description { get; init; }
    public int? CycleId { get; init; }
    public bool IsAnonymous { get; init; }
    public DateTime? StartsAt { get; init; }
    public DateTime? ExpiresAt { get; init; }
    public List<CreateSurveyQuestionRequest> Questions { get; init; } = new();
}

public record UpdateSurveyRequest : CreateSurveyRequest
{
    public int Id { get; init; }
}

public record CreateSurveyQuestionRequest
{
    public QuestionType QuestionType { get; init; }
    public string QuestionText { get; init; } = string.Empty;
    public string? QuestionTextLocal { get; init; }
    public List<string>? Options { get; init; }
    public bool IsRequired { get; init; } = true;
    public int SortOrder { get; init; }
}

public record UpdateSurveyStatusRequest
{
    public SurveyStatus Status { get; init; }
}

// ───── Survey Response DTOs ─────

public record SurveyResponseDto
{
    public int Id { get; init; }
    public int SurveyId { get; init; }
    public string SurveyTitle { get; init; } = string.Empty;
    public int RespondentRepId { get; init; }
    public string RepName { get; init; } = string.Empty;
    public int CustomerId { get; init; }
    public string CustomerName { get; init; } = string.Empty;
    public int? VisitId { get; init; }
    public DateTime CompletedAt { get; init; }
    public List<SurveyAnswerDto> Answers { get; init; } = new();
}

public record SurveyAnswerDto
{
    public int Id { get; init; }
    public int QuestionId { get; init; }
    public string QuestionText { get; init; } = string.Empty;
    public QuestionType QuestionType { get; init; }
    public string? AnswerValue { get; init; }
    public List<string>? SelectedOptions { get; init; }
}

public record SubmitSurveyResponseRequest
{
    public int SurveyId { get; init; }
    public int RespondentRepId { get; init; }
    public int CustomerId { get; init; }
    public int? VisitId { get; init; }
    public List<SubmitAnswerRequest> Answers { get; init; } = new();
}

public record SubmitAnswerRequest
{
    public int QuestionId { get; init; }
    public string? AnswerValue { get; init; }
    public List<string>? SelectedOptions { get; init; }
}

// ───── Survey Analytics DTOs ─────

public record SurveyAnalyticsDto
{
    public int SurveyId { get; init; }
    public string SurveyTitle { get; init; } = string.Empty;
    public int TotalResponses { get; init; }
    public List<QuestionAnalyticsDto> QuestionAnalytics { get; init; } = new();
}

public record QuestionAnalyticsDto
{
    public int QuestionId { get; init; }
    public string QuestionText { get; init; } = string.Empty;
    public QuestionType QuestionType { get; init; }
    public int AnswerCount { get; init; }
    public double? AverageRating { get; init; }
    public Dictionary<string, int> OptionDistribution { get; init; } = new();
    public List<string> TextResponses { get; init; } = new();
}

public record SurveyFilterDto
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 10;
    public string? Search { get; init; }
    public SurveyStatus? Status { get; init; }
    public int? CycleId { get; init; }
    public string? SortBy { get; init; }
    public string? SortDirection { get; init; }
}
