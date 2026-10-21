using System.ComponentModel.DataAnnotations;
using TaskFlow.Api.Models;

namespace TaskFlow.Api.Dtos;

/// <summary>Digunakan untuk create (POST) dan update (PUT).</summary>
public class TaskRequest
{
    [Required(ErrorMessage = "Title is required."),
     StringLength(200, ErrorMessage = "Title must be 200 characters or fewer.")]
    public string Title { get; set; } = "";

    [StringLength(2000, ErrorMessage = "Description must be 2000 characters or fewer.")]
    public string? Description { get; set; }

    [EnumDataType(typeof(TaskPriority), ErrorMessage = "Priority must be Low, Medium or High.")]
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;

    public DateOnly? DueDate { get; set; }
}

public class UpdateStatusRequest
{
    [Required(ErrorMessage = "Status is required."),
     EnumDataType(typeof(TaskItemStatus), ErrorMessage = "Status must be Todo or Done.")]
    public TaskItemStatus? Status { get; set; }
}

public record TaskResponse(
    int Id, string Title, string? Description, TaskPriority Priority,
    DateOnly? DueDate, TaskItemStatus Status, DateTime CreatedAt, DateTime UpdatedAt);