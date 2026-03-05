using Application.Common;
using Application.DTOs.Common;
using Application.DTOs.Surveys;
using Application.DTOs.Materials;

namespace Application.Interfaces;

// ───── Survey Service ─────

public interface ISurveyService
{
    Task<PagedResult<SurveyDto>> GetSurveysAsync(SurveyFilterDto filter);
    Task<SurveyDetailDto?> GetSurveyByIdAsync(int id);
    Task<SurveyDto> CreateSurveyAsync(CreateSurveyRequest request);
    Task<SurveyDto> UpdateSurveyAsync(UpdateSurveyRequest request);
    Task UpdateSurveyStatusAsync(int id, UpdateSurveyStatusRequest request);
    Task DeleteSurveyAsync(int id);

    // Questions
    Task<SurveyQuestionDto> AddQuestionAsync(int surveyId, CreateSurveyQuestionRequest request);
    Task<SurveyQuestionDto> UpdateQuestionAsync(int surveyId, int questionId, CreateSurveyQuestionRequest request);
    Task DeleteQuestionAsync(int surveyId, int questionId);
    Task ReorderQuestionsAsync(int surveyId, List<int> questionIds);

    // Responses
    Task<SurveyResponseDto> SubmitResponseAsync(SubmitSurveyResponseRequest request);
    Task<PagedResult<SurveyResponseDto>> GetResponsesAsync(int surveyId, int page = 1, int pageSize = 10);
    Task<SurveyResponseDto?> GetResponseByIdAsync(int responseId);

    // Analytics
    Task<SurveyAnalyticsDto> GetSurveyAnalyticsAsync(int surveyId);
    Task<byte[]> ExportSurveyResultsAsync(int surveyId);
}

// ───── Material Distribution Service ─────

public interface IMaterialDistributionService
{
    // Distributions
    Task<PagedResult<MaterialDistributionDto>> GetDistributionsAsync(DistributionFilterDto filter);
    Task<MaterialDistributionDto?> GetDistributionByIdAsync(int id);
    Task<MaterialDistributionDto> CreateDistributionAsync(CreateDistributionRequest request);
    Task DeleteDistributionAsync(int id);

    // Rep Inventory
    Task<List<RepInventoryDto>> GetRepInventoryAsync(int repId);
    Task<RepInventoryDto> UpdateRepInventoryAsync(UpdateRepInventoryRequest request);
    Task RestockInventoryAsync(int inventoryId, RestockInventoryRequest request);
    Task DeleteRepInventoryAsync(int inventoryId);

    // Reports
    Task<DistributionSummaryDto> GetDistributionSummaryAsync(DateTime? from, DateTime? to, int? repId);
    Task<byte[]> ExportDistributionsAsync(DistributionFilterDto filter);
}
