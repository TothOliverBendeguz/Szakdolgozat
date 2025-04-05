namespace SzakDolgozat.Api.DTOs
{
    public class UserActivityLogDto
    {
        public int Id { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string UserEmail { get; set; }
        public int? ProjectId { get; set; }
        public string ProjectName { get; set; }
        public int? TaskId { get; set; }
        public string TaskName { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; }
        public bool IsProjectDeleted { get; set; }
        public bool IsTaskDeleted { get; set; }
    }

    public class CreateActivityLogDto
    {
        public string UserId { get; set; }
        public int? ProjectId { get; set; }
        public int? TaskId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Description { get; set; }
    }
}