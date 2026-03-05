using Application.Common;
using Application.DTOs.Common;
using Application.DTOs.Surveys;
using Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

[ApiController]
[Route("api/surveys")]
[Authorize]
public class SurveysController : ControllerBase
{
    private readonly ISurveyService _surveyService;

    public SurveysController(ISurveyService surveyService)
    {
        _surveyService = surveyService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<SurveyDto>>> GetSurveys([FromQuery] SurveyFilterDto filter)
    {
        var result = await _surveyService.GetSurveysAsync(filter);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SurveyDetailDto>> GetSurvey(int id)
    {
        var survey = await _surveyService.GetSurveyByIdAsync(id);
        if (survey == null) return NotFound();
        return Ok(survey);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<SurveyDto>> CreateSurvey([FromBody] CreateSurveyRequest request)
    {
        var survey = await _surveyService.CreateSurveyAsync(request);
        return CreatedAtAction(nameof(GetSurvey), new { id = survey.Id }, survey);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<SurveyDto>> UpdateSurvey(int id, [FromBody] UpdateSurveyRequest request)
    {
        if (id != request.Id) return BadRequest("ID mismatch");
        var survey = await _surveyService.UpdateSurveyAsync(request);
        return Ok(survey);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateSurveyStatusRequest request)
    {
        await _surveyService.UpdateSurveyStatusAsync(id, request);
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> DeleteSurvey(int id)
    {
        await _surveyService.DeleteSurveyAsync(id);
        return NoContent();
    }

    // ───── Questions ─────

    [HttpPost("{surveyId:int}/questions")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<SurveyQuestionDto>> AddQuestion(int surveyId, [FromBody] CreateSurveyQuestionRequest request)
    {
        var question = await _surveyService.AddQuestionAsync(surveyId, request);
        return Ok(question);
    }

    [HttpPut("{surveyId:int}/questions/{questionId:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<SurveyQuestionDto>> UpdateQuestion(int surveyId, int questionId, [FromBody] CreateSurveyQuestionRequest request)
    {
        var question = await _surveyService.UpdateQuestionAsync(surveyId, questionId, request);
        return Ok(question);
    }

    [HttpDelete("{surveyId:int}/questions/{questionId:int}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> DeleteQuestion(int surveyId, int questionId)
    {
        await _surveyService.DeleteQuestionAsync(surveyId, questionId);
        return NoContent();
    }

    [HttpPut("{surveyId:int}/questions/reorder")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> ReorderQuestions(int surveyId, [FromBody] List<int> questionIds)
    {
        await _surveyService.ReorderQuestionsAsync(surveyId, questionIds);
        return NoContent();
    }

    // ───── Responses ─────

    [HttpPost("responses")]
    public async Task<ActionResult<SurveyResponseDto>> SubmitResponse([FromBody] SubmitSurveyResponseRequest request)
    {
        var response = await _surveyService.SubmitResponseAsync(request);
        return CreatedAtAction(nameof(GetResponse), new { id = response.Id }, response);
    }

    [HttpGet("{surveyId:int}/responses")]
    public async Task<ActionResult<PagedResult<SurveyResponseDto>>> GetResponses(int surveyId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _surveyService.GetResponsesAsync(surveyId, page, pageSize);
        return Ok(result);
    }

    [HttpGet("responses/{id:int}")]
    public async Task<ActionResult<SurveyResponseDto>> GetResponse(int id)
    {
        var response = await _surveyService.GetResponseByIdAsync(id);
        if (response == null) return NotFound();
        return Ok(response);
    }

    // ───── Analytics ─────

    [HttpGet("{surveyId:int}/analytics")]
    public async Task<ActionResult<SurveyAnalyticsDto>> GetAnalytics(int surveyId)
    {
        var analytics = await _surveyService.GetSurveyAnalyticsAsync(surveyId);
        return Ok(analytics);
    }

    [HttpGet("{surveyId:int}/export")]
    public async Task<IActionResult> ExportResults(int surveyId)
    {
        var bytes = await _surveyService.ExportSurveyResultsAsync(surveyId);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", $"survey_{surveyId}_results.xlsx");
    }
}
