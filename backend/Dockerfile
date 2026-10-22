FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
# Salin .csproj dulu supaya lapisan restore di-cache
COPY TaskFlow.Api/TaskFlow.Api.csproj TaskFlow.Api/
RUN dotnet restore TaskFlow.Api/TaskFlow.Api.csproj
COPY TaskFlow.Api/ TaskFlow.Api/
RUN dotnet publish TaskFlow.Api/TaskFlow.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
COPY --from=build /app/publish .
EXPOSE 8080
USER app
ENTRYPOINT ["dotnet", "TaskFlow.Api.dll"]
