using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzakDolgozat.Api.Models
{
    public class Project
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime PlannedEndDate { get; set; }

        [Required]
        [StringLength(100)]
        public string ProjectManager { get; set; }

        public bool IsActive { get; set; }

        [StringLength(500)]
        public string? Description { get; set; }

        public string? Repository { get; set; }

        public string? UserId { get; set; }

        public string? CreatedById { get; set; }

        public bool IsDeleted { get; set; } = false;

        public DateTime? DeletedAt { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [ForeignKey("CreatedById")]
        public User? CreatedBy { get; set; }

        public virtual ICollection<ProjectUser> ProjectUsers { get; set; } = new List<ProjectUser>();
    }
}