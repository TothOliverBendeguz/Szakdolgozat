using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzakDolgozat.Api.Models
{
    public class TaskAssignment
    {
        [Key]
        [Column(Order = 0)]
        public int TaskId { get; set; }

        [Key]
        [Column(Order = 1)]
        public string UserId { get; set; }

        [Required]
        public DateTime AssignedAt { get; set; }

        [Required]
        [StringLength(50)]
        public string Role { get; set; } // "Responsible", "Contributor", "Reviewer"

        [ForeignKey("TaskId")]
        public virtual ProjectTask ProjectTask { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }
    }
}