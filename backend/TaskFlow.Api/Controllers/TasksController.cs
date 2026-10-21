using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Api.Dtos;
using TaskFlow.Api.Services;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/tasks")]

public class TasksController(ITaskService tasks) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<TaskResponse>>> GetAll(CancellationToken ct) =>
        Ok(await tasks.GetAllAsync(ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskResponse>> GetById(int id, CancellationToken ct) =>
        Ok(await tasks.GetByIdAsync(id, ct));

    [HttpPost]
    public async Task<ActionResult<TaskResponse>> Create(TaskRequest request, CancellationToken ct)
    {
        var created = await tasks.CreateAsync(request, ct);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TaskResponse>> Update(int id, TaskRequest request, CancellationToken ct) =>
        Ok(await tasks.UpdateAsync(id, request, ct));

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult<TaskResponse>> SetStatus(int id, UpdateStatusRequest request, CancellationToken ct) =>
        Ok(await tasks.SetStatusAsync(id, request.Status!.Value, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await tasks.DeleteAsync(id, ct);
        return NoContent();
    }
}