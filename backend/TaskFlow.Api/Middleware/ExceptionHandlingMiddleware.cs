using TaskFlow.Api.Dtos;
using TaskFlow.Api.Exceptions;

namespace TaskFlow.Api.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (AppException ex)
        {
            // Ralat yang kita jangka (404, 401, ...): mesej selamat untuk pengguna
            await Write(ctx, ex.StatusCode, ex.Message);
        }
        catch (OperationCanceledException) when (ctx.RequestAborted.IsCancellationRequested)
        {
            // Klien putus sambungan, tiada apa nak dihantar
        }
        catch (Exception ex)
        {
            // Ralat tak dijangka: log butiran penuh, tapi jangan dedahkan kepada klien
            logger.LogError(ex, "Unhandled exception for {Method} {Path}", ctx.Request.Method, ctx.Request.Path);
            await Write(ctx, StatusCodes.Status500InternalServerError,
                "An unexpected error occurred. Please try again.");
        }
    }

    private static Task Write(HttpContext ctx, int status, string message)
    {
        if (ctx.Response.HasStarted) return Task.CompletedTask;
        ctx.Response.StatusCode = status;
        return ctx.Response.WriteAsJsonAsync(new ApiError(status, message, null, ctx.TraceIdentifier));
    }
}