using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SzakDolgozat.Api.Models
{
    public class UserSettings
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string UserId { get; set; }

        [StringLength(50)]
        public string DefaultProjectView { get; set; } = "card"; 

        [StringLength(50)]
        public string DefaultGraphView { get; set; } = "all"; 

        [StringLength(50)]
        public string UiTheme { get; set; } = "light"; 

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}