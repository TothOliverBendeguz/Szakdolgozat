namespace SzakDolgozat.Api.Dtos
{
    public class ProjectRelationDto
    {
        public int? Id { get; set; }
        public int SourceProjectId { get; set; }
        public int TargetProjectId { get; set; }
        public string RelationType { get; set; }
        public string Description { get; set; }

        public string SourceProjectName { get; set; }
        public string TargetProjectName { get; set; }
    }
}