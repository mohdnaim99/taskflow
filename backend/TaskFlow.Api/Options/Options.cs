namespace TaskFlow.Api.Options;

public class JwtOptions
{
    public string Key { get; set; } = "";
    public string Issuer { get; set; } = "taskflow-api";
    public string Audience { get; set; } = "taskflow-web";
    public int ExpiryMinutes { get; set; } = 60;
}

/// <summary>User demo (dibenarkan oleh brief). Nilai datang dari konfigurasi, bukan kod.</summary>
public class AdminUserOptions
{
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
}