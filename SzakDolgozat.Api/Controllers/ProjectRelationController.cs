using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SzakDolgozat.Api.Data;
using SzakDolgozat.Api.DTOs;
using SzakDolgozat.Api.Models;
using System.Security.Claims;
using SzakDolgozat.Api.Dtos;

namespace SzakDolgozat.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectRelationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ProjectRelationController> _logger;

        public ProjectRelationController(
            ApplicationDbContext context,
            ILogger<ProjectRelationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProjectRelationDto>>> GetAllRelations()
        {
            try
            {
                var relations = await _context.ProjectRelations
                    .Include(pr => pr.SourceProject)
                    .Include(pr => pr.TargetProject)
                    .Select(pr => new ProjectRelationDto
                    {
                        Id = pr.Id,
                        SourceProjectId = pr.SourceProjectId,
                        TargetProjectId = pr.TargetProjectId,
                        RelationType = pr.RelationType,
                        Description = pr.Description,
                        SourceProjectName = pr.SourceProject.Name,
                        TargetProjectName = pr.TargetProject.Name
                    })
                    .ToListAsync();

                return Ok(relations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project relations");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("project/{projectId}")]
        public async Task<ActionResult<IEnumerable<ProjectRelationDto>>> GetProjectRelations(int projectId)
        {
            try
            {
                var relations = await _context.ProjectRelations
                    .Where(pr => pr.SourceProjectId == projectId || pr.TargetProjectId == projectId)
                    .Include(pr => pr.SourceProject)
                    .Include(pr => pr.TargetProject)
                    .Select(pr => new ProjectRelationDto
                    {
                        Id = pr.Id,
                        SourceProjectId = pr.SourceProjectId,
                        TargetProjectId = pr.TargetProjectId,
                        RelationType = pr.RelationType,
                        Description = pr.Description,
                        SourceProjectName = pr.SourceProject.Name,
                        TargetProjectName = pr.TargetProject.Name
                    })
                    .ToListAsync();

                return Ok(relations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project relations");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPost]
        public async Task<ActionResult<ProjectRelationDto>> CreateRelation(ProjectRelationDto relationDto)
        {
            try
            {
                _logger.LogInformation($"Creating relation: {System.Text.Json.JsonSerializer.Serialize(relationDto)}");

                if (relationDto == null)
                {
                    return BadRequest("Relation data is null");
                }

                if (relationDto.SourceProjectId <= 0)
                {
                    return BadRequest("Source project ID must be positive");
                }

                if (relationDto.TargetProjectId <= 0)
                {
                    return BadRequest("Target project ID must be positive");
                }

                if (string.IsNullOrEmpty(relationDto.RelationType))
                {
                    return BadRequest("Relation type is required");
                }
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                var sourceProject = await _context.Projects.FindAsync(relationDto.SourceProjectId);
                var targetProject = await _context.Projects.FindAsync(relationDto.TargetProjectId);

                if (sourceProject == null || targetProject == null)
                {
                    return NotFound("One or both projects not found");
                }

                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
                var isAdmin = userRole == "1";
                var isSourceProjectOwner = sourceProject.UserId == userId || sourceProject.CreatedById == userId;

                if (!isAdmin && !isSourceProjectOwner)
                {
                    return Forbid();
                }

                if (relationDto.SourceProjectId == relationDto.TargetProjectId)
                {
                    return BadRequest("Cannot create a relation between a project and itself");
                }

                var existingRelation = await _context.ProjectRelations
                    .AnyAsync(pr =>
                        pr.SourceProjectId == relationDto.SourceProjectId &&
                        pr.TargetProjectId == relationDto.TargetProjectId);

                if (existingRelation)
                {
                    return BadRequest("A relation already exists between these projects");
                }

                var relation = new ProjectRelation
                {
                    SourceProjectId = relationDto.SourceProjectId,
                    TargetProjectId = relationDto.TargetProjectId,
                    RelationType = relationDto.RelationType,
                    Description = relationDto.Description
                };

                _context.ProjectRelations.Add(relation);
                await _context.SaveChangesAsync();

                string inverseRelationType = GetInverseRelationType(relationDto.RelationType);

                if (!string.IsNullOrEmpty(inverseRelationType))
                {
                    var inverseRelation = new ProjectRelation
                    {
                        SourceProjectId = relationDto.TargetProjectId,
                        TargetProjectId = relationDto.SourceProjectId,
                        RelationType = inverseRelationType,
                        Description = $"Automatikus fordított kapcsolat: {relationDto.Description}"
                    };

                    _context.ProjectRelations.Add(inverseRelation);
                    await _context.SaveChangesAsync();
                }

                relationDto.Id = relation.Id;
                relationDto.SourceProjectName = sourceProject.Name;
                relationDto.TargetProjectName = targetProject.Name;

                return CreatedAtAction(nameof(GetRelation), new { id = relation.Id }, relationDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating project relation");
                return StatusCode(500, new { message = "Internal server error: " + ex.Message });
            }
        }

        private string GetInverseRelationType(string relationType)
        {
            switch (relationType)
            {
                case "Depends on": return "Is depended on by";
                case "Parent of": return "Child of";
                case "Child of": return "Parent of";
                case "Related to": return "Related to";
                default: return null;
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectRelationDto>> GetRelation(int id)
        {
            try
            {
                var relation = await _context.ProjectRelations
                    .Include(pr => pr.SourceProject)
                    .Include(pr => pr.TargetProject)
                    .FirstOrDefaultAsync(pr => pr.Id == id);

                if (relation == null)
                {
                    return NotFound();
                }

                var relationDto = new ProjectRelationDto
                {
                    Id = relation.Id,
                    SourceProjectId = relation.SourceProjectId,
                    TargetProjectId = relation.TargetProjectId,
                    RelationType = relation.RelationType,
                    Description = relation.Description,
                    SourceProjectName = relation.SourceProject.Name,
                    TargetProjectName = relation.TargetProject.Name
                };

                return Ok(relationDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting project relation");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRelation(int id, ProjectRelationDto relationDto)
        {
            if (id != relationDto.Id)
            {
                return BadRequest();
            }

            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var relation = await _context.ProjectRelations.FindAsync(id);

                if (relation == null)
                {
                    return NotFound();
                }

                var isAdmin = userRole == "1";

                if (!isAdmin)
                {
                    var sourceProject = await _context.Projects.FindAsync(relation.SourceProjectId);
                    var targetProject = await _context.Projects.FindAsync(relation.TargetProjectId);

                    if (sourceProject == null || targetProject == null)
                    {
                        return NotFound("One or both projects not found");
                    }

                    var isSourceProjectOwner = sourceProject.UserId == userId;
                    var isTargetProjectOwner = targetProject.UserId == userId;

                    if (!isSourceProjectOwner && !isTargetProjectOwner)
                    {
                        return Forbid();
                    }
                }

                relation.RelationType = relationDto.RelationType;
                relation.Description = relationDto.Description;

                _context.Entry(relation).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating project relation");
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRelation(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var relation = await _context.ProjectRelations
                    .Include(pr => pr.SourceProject)
                    .Include(pr => pr.TargetProject)
                    .FirstOrDefaultAsync(pr => pr.Id == id);

                if (relation == null)
                {
                    return NotFound();
                }

                var isAdmin = userRole == "1";

                if (!isAdmin)
                {
                    var isSourceProjectOwner = relation.SourceProject?.UserId == userId;
                    var isTargetProjectOwner = relation.TargetProject?.UserId == userId;

                    if (!isSourceProjectOwner && !isTargetProjectOwner)
                    {
                        return Forbid();
                    }
                }

                _context.ProjectRelations.Remove(relation);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting project relation");
                return StatusCode(500, "Internal server error");
            }
        }
    }
}