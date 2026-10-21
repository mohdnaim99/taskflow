namespace TaskFlow.Api.Models;

public enum TaskPriority { Low, Medium, High }

public enum TaskItemStatus { Todo, Done }

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public DateOnly? DueDate { get; set; }
    public TaskItemStatus Status { get; set; } = TaskItemStatus.Todo;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}