using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzakDolgozat.Api.Models
{
    public class ProjectDocument
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        [StringLength(255)]
        public string FileName { get; set; }

        [Required]
        [StringLength(100)]
        public string ContentType { get; set; }

        [Required]
        public string FilePath { get; set; }

        public long FileSize { get; set; }

        public DateTime UploadedAt { get; set; }

        public string? CreatedById { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }

        [ForeignKey("CreatedById")]
        public User? CreatedBy { get; set; }
    }
}