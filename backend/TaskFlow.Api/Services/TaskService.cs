using TaskFlow.Api.Dtos;
using TaskFlow.Api.Exceptions;
using TaskFlow.Api.Models;
using TaskFlow.Api.Repositories;

namespace TaskFlow.Api.Services;

public interface ITaskService
{
    Task<IReadOnlyList<TaskResponse>> GetAllAsync(CancellationToken ct);
    Task<TaskResponse> GetByIdAsync(int id, CancellationToken ct);
    Task<TaskResponse> CreateAsync(TaskRequest request, CancellationToken ct);
    Task<TaskResponse> UpdateAsync(int id, TaskRequest request, CancellationToken ct);
    Task<TaskResponse> SetStatusAsync(int id, TaskItemStatus status, CancellationToken ct);
    Task DeleteAsync(int id, CancellationToken ct);
}

public class TaskService(ITaskRepository repo) : ITaskService
{
    public async Task<IReadOnlyList<TaskResponse>> GetAllAsync(CancellationToken ct) =>
        (await repo.GetAllAsync(ct)).Select(ToResponse).ToList();

    public async Task<TaskResponse> GetByIdAsync(int id, CancellationToken ct) =>
        ToResponse(await FindAsync(id, ct));

    public async Task<TaskResponse> CreateAsync(TaskRequest request, CancellationToken ct)
    {
        var now = DateTime.UtcNow;
        var task = new TaskItem { CreatedAt = now, UpdatedAt = now, Status = TaskItemStatus.Todo };
        Apply(task, request);
        await repo.AddAsync(task, ct);
        await repo.SaveChangesAsync(ct);
        return ToResponse(task);
    }

    public async Task<TaskResponse> UpdateAsync(int id, TaskRequest request, CancellationToken ct)
    {
        var task = await FindAsync(id, ct);
        Apply(task, request);
        task.UpdatedAt = DateTime.UtcNow;
        await repo.SaveChangesAsync(ct);
        return ToResponse(task);
    }

    public async Task<TaskResponse> SetStatusAsync(int id, TaskItemStatus status, CancellationToken ct)
    {
        var task = await FindAsync(id, ct);
        task.Status = status;
        task.UpdatedAt = DateTime.UtcNow;
        await repo.SaveChangesAsync(ct);
        return ToResponse(task);
    }

    public async Task DeleteAsync(int id, CancellationToken ct)
    {
        var task = await FindAsync(id, ct);
        repo.Remove(task);
        await repo.SaveChangesAsync(ct);
    }

    private async Task<TaskItem> FindAsync(int id, CancellationToken ct) =>
        await repo.GetByIdAsync(id, ct) ?? throw new NotFoundException($"Task {id} was not found.");

    private static void Apply(TaskItem task, TaskRequest r)
    {
        task.Title = r.Title.Trim();
        task.Description = string.IsNullOrWhiteSpace(r.Description) ? null : r.Description.Trim();
        task.Priority = r.Priority;
        task.DueDate = r.DueDate;
    }

    private static TaskResponse ToResponse(TaskItem t) =>
        new(t.Id, t.Title, t.Description, t.Priority, t.DueDate, t.Status, t.CreatedAt, t.UpdatedAt);
}