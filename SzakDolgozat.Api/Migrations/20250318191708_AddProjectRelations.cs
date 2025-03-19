using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SzakDolgozat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ProjectRelations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SourceProjectId = table.Column<int>(type: "int", nullable: false),
                    TargetProjectId = table.Column<int>(type: "int", nullable: false),
                    RelationType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectRelations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectRelations_Projects_SourceProjectId",
                        column: x => x.SourceProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_ProjectRelations_Projects_TargetProjectId",
                        column: x => x.TargetProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id");
                });

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "0713ae1b-c1c4-45f5-b4f0-cbd98977ee9a",
                column: "ConcurrencyStamp",
                value: "8fadf074-f935-4613-a978-57baffc02b98");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "8450e6c0-e5a6-41b2-8957-978998ebdaeb",
                column: "ConcurrencyStamp",
                value: "18046a45-c763-4240-a9a6-bd20c4992708");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "ca1b544d-b871-4344-a8bd-d73d30a36307",
                column: "ConcurrencyStamp",
                value: "6465ea2a-5ed9-4d14-a5c0-8b6bc9bb64c7");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "1a5ef115-89dc-483c-8539-f82f89250cc3",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "012412af-f126-4f9a-872b-fbb9e23ab317", "AQAAAAIAAYagAAAAEMI/Mkp1zXdMK8U9cz1wDD/5XWzVC+tz/3m/2ik7CipkBWrPPOdpCxNkkVpGOSIeUA==", "4c35a953-5ff2-4986-b834-f165e2cf5b6a" });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectRelations_SourceProjectId",
                table: "ProjectRelations",
                column: "SourceProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectRelations_TargetProjectId",
                table: "ProjectRelations",
                column: "TargetProjectId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectRelations");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "0713ae1b-c1c4-45f5-b4f0-cbd98977ee9a",
                column: "ConcurrencyStamp",
                value: "f92e39ea-5d14-4cd5-b289-07b1d060418d");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "8450e6c0-e5a6-41b2-8957-978998ebdaeb",
                column: "ConcurrencyStamp",
                value: "dfb142f3-c778-4928-964c-b1aecba7ec5c");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "ca1b544d-b871-4344-a8bd-d73d30a36307",
                column: "ConcurrencyStamp",
                value: "086b7048-9412-455f-8fd7-329d26d85f08");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "1a5ef115-89dc-483c-8539-f82f89250cc3",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "c5e4e8f7-18fa-4c5a-ba68-0b3b6ae3daf5", "AQAAAAIAAYagAAAAELyzB9EmOLcft1D3U2/SGPfmEH/tsSaf4F9DRxQVZVRXy9zkXCri2vf4GfcreDcFtA==", "55b22a30-b654-4f90-af58-aecfcd8e1bae" });
        }
    }
}
