using System.ComponentModel.DataAnnotations;

namespace TaskFlow.Api.Dtos;

public class LoginRequest
{
    [Required(ErrorMessage = "Email is required."),
     EmailAddress(ErrorMessage = "Email is not valid.")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = "";
}

public record LoginResponse(string Token, DateTime ExpiresAt);