namespace TaskFlow.Api.Exceptions;

public abstract class AppException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

public class NotFoundException(string message) : AppException(StatusCodes.Status404NotFound, message);

public class UnauthorizedException(string message) : AppException(StatusCodes.Status401Unauthorized, message);