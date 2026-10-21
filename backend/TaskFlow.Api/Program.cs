using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TaskFlow.Api.Data;
using TaskFlow.Api.Dtos;
using TaskFlow.Api.Middleware;
using TaskFlow.Api.Options;
using TaskFlow.Api.Repositories;
using TaskFlow.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ---- Konfigurasi (gagal awal kalau tiada; tiada rahsia dalam kod) ----
var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? throw new InvalidOperationException("ConnectionStrings__Default is not configured.");

var jwt = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
if (jwt.Key.Length < 32)
    throw new InvalidOperationException("Jwt__Key must be set and at least 32 characters long.");

var admin = builder.Configuration.GetSection("Auth").Get<AdminUserOptions>() ?? new AdminUserOptions();
if (string.IsNullOrWhiteSpace(admin.Email) || string.IsNullOrEmpty(admin.Password))
    throw new InvalidOperationException("Auth__Email and Auth__Password must be set.");

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<AdminUserOptions>(builder.Configuration.GetSection("Auth"));

// ---- Services ----
builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(connectionString));
builder.Services.AddScoped<ITaskRepository, TaskRepository>();
builder.Services.AddScoped<ITaskService, TaskService>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddControllers()
    .AddJsonOptions(o => o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()))
    .ConfigureApiBehaviorOptions(o =>
        o.InvalidModelStateResponseFactory = ctx =>
        {
            var errors = ctx.ModelState
                .Where(e => e.Value is { Errors.Count: > 0 })
                .ToDictionary(
                    e => e.Key.TrimStart('$', '.'),
                    e => e.Value!.Errors
                        .Select(x => string.IsNullOrWhiteSpace(x.ErrorMessage) ? "Invalid value." : x.ErrorMessage)
                        .ToArray());

            return new BadRequestObjectResult(
                new ApiError(400, "One or more fields are invalid.", errors, ctx.HttpContext.TraceIdentifier));
        });

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key))
        };
        // 401 dalam format ralat yang sama dengan API lain
        o.Events = new JwtBearerEvents
        {
            OnChallenge = async ctx =>
            {
                ctx.HandleResponse();
                ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await ctx.Response.WriteAsJsonAsync(
                    new ApiError(401, "Authentication required or token is invalid/expired."));
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddHealthChecks();   // untuk probe Kubernetes nanti

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "TaskFlow API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Paste the token from POST /api/auth/login."
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        [new OpenApiSecurityScheme
        {
            Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
        }] = Array.Empty<string>()
    });
});

var app = builder.Build();

// ---- Pipeline ----
app.UseMiddleware<ExceptionHandlingMiddleware>();   // paling awal

// Swagger sentiasa aktif (brief: "Swagger enabled"). Dalam Docker, environment ialah
// Production, jadi jika dalam blok IsDevelopment() ia tak akan muncul.
app.UseSwagger();
app.UseSwaggerUI();

app.UseAuthentication();   // mesti sebelum UseAuthorization
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health").AllowAnonymous();

app.Run();