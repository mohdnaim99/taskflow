namespace TaskFlow.Api.Dtos;

public record ApiError(
    int Status,
    string Message,
    IDictionary<string, string[]>? Errors = null,
    string? TraceId = null);