using Microsoft.EntityFrameworkCore;
using TaskFlow.Api.Data;
using TaskFlow.Api.Models;

namespace TaskFlow.Api.Repositories;

public interface ITaskRepository
{
    Task<List<TaskItem>> GetAllAsync(CancellationToken ct);
    Task<TaskItem?> GetByIdAsync(int id, CancellationToken ct);
    Task AddAsync(TaskItem task, CancellationToken ct);
    void Remove(TaskItem task);
    Task SaveChangesAsync(CancellationToken ct);
}

public class TaskRepository(AppDbContext db) : ITaskRepository
{
    public Task<List<TaskItem>> GetAllAsync(CancellationToken ct) =>
        db.Tasks.AsNoTracking().OrderByDescending(t => t.CreatedAt).ToListAsync(ct);

    public Task<TaskItem?> GetByIdAsync(int id, CancellationToken ct) =>
        db.Tasks.FirstOrDefaultAsync(t => t.Id == id, ct);

    public async Task AddAsync(TaskItem task, CancellationToken ct) =>
        await db.Tasks.AddAsync(task, ct);

    public void Remove(TaskItem task) => db.Tasks.Remove(task);

    public Task SaveChangesAsync(CancellationToken ct) => db.SaveChangesAsync(ct);
}