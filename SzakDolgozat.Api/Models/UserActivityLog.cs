using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzakDolgozat.Api.Models
{
    public class UserActivityLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        public int? ProjectId { get; set; }

        public int? TaskId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        [ForeignKey("ProjectId")]
        public virtual Project Project { get; set; }

        [ForeignKey("TaskId")]
        public virtual ProjectTask Task { get; set; }

        public bool IsProjectDeleted { get; set; } = false;
        public bool IsTaskDeleted { get; set; } = false;

        [StringLength(100)]
        public string ProjectName { get; set; } = string.Empty;

        [StringLength(100)]
        public string TaskName { get; set; } = string.Empty;
    }
}