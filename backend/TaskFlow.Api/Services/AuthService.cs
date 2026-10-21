using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TaskFlow.Api.Dtos;
using TaskFlow.Api.Exceptions;
using TaskFlow.Api.Options;

namespace TaskFlow.Api.Services;

public interface IAuthService
{
    LoginResponse Login(LoginRequest request);
}

public class AuthService(IOptions<AdminUserOptions> admin, IOptions<JwtOptions> jwt) : IAuthService
{
    public LoginResponse Login(LoginRequest request)
    {
        var a = admin.Value;
        var emailOk = string.Equals(request.Email.Trim(), a.Email, StringComparison.OrdinalIgnoreCase);
        var passOk = CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(request.Password), Encoding.UTF8.GetBytes(a.Password));

        // Mesej sama untuk email salah atau password salah: tak dedahkan yang mana satu
        if (!emailOk || !passOk) throw new UnauthorizedException("Invalid email or password.");

        var o = jwt.Value;
        var expires = DateTime.UtcNow.AddMinutes(o.ExpiryMinutes);
        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(o.Key)), SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: o.Issuer,
            audience: o.Audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, a.Email),
                new Claim(JwtRegisteredClaimNames.Email, a.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            ],
            expires: expires,
            signingCredentials: creds);

        return new LoginResponse(new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}