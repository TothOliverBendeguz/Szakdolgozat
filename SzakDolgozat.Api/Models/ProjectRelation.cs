using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzakDolgozat.Api.Models
{
    public class ProjectRelation
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int SourceProjectId { get; set; }

        [Required]
        public int TargetProjectId { get; set; }

        [Required]
        [StringLength(50)]
        public string RelationType { get; set; }

        public string? Description { get; set; }

        [ForeignKey("SourceProjectId")]
        public virtual Project SourceProject { get; set; }

        [ForeignKey("TargetProjectId")]
        public virtual Project TargetProject { get; set; }
    }
}