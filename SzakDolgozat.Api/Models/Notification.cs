using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzakDolgozat.Api.Models
{
    public class NotificationPreference
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        [Required]
        public bool Enabled { get; set; } = true;

      
        [Required]
        public int DaysBeforeDeadline { get; set; } = 30;

        [Required]
        public int FrequencyInDays { get; set; } = 7;

  
        [Required]
        public bool OnlyActiveProjects { get; set; } = true;

        
        [Required]
        public bool OnlyAssignedProjects { get; set; } = false;

        [Required]
        public bool AlwaysNotifyOneDayBefore { get; set; } = true;

        public bool EmailEnabled { get; set; } = true;

        public int EmailFrequencyInDays { get; set; } = 7;

        [ForeignKey("UserId")]
        public User? User { get; set; }  
    }

    public class Notification
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        public int? ProjectId { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [Required]
        [StringLength(1000)]
        public string Message { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public bool IsRead { get; set; } = false;

        [Required]
        [StringLength(50)]
        public string Type { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }
    }
}