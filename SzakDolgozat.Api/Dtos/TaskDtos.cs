namespace SzakDolgozat.Api.DTOs
{
    public class TaskAssignmentDto
    {
        public string UserId { get; set; }
        public string Role { get; set; }
    }

    public class CreateTaskDto
    {
        public int ProjectId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public string Priority { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
        public List<TaskAssignmentDto> Assignments { get; set; } = new List<TaskAssignmentDto>();
    }

    public class UpdateTaskDto
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public string Priority { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public List<TaskAssignmentDto> Assignments { get; set; } = new List<TaskAssignmentDto>();
    }

    public class TaskResponseDto
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public string Priority { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime DueDate { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string CreatedById { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<UserDto> AssignedUsers { get; set; } = new List<UserDto>();
    }
}