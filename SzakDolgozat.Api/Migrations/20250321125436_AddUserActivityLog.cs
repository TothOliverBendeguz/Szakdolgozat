using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SzakDolgozat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddUserActivityLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "UserActivityLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProjectId = table.Column<int>(type: "int", nullable: true),
                    TaskId = table.Column<int>(type: "int", nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsProjectDeleted = table.Column<bool>(type: "bit", nullable: false),
                    IsTaskDeleted = table.Column<bool>(type: "bit", nullable: false),
                    ProjectName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    TaskName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserActivityLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserActivityLogs_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserActivityLogs_ProjectTasks_TaskId",
                        column: x => x.TaskId,
                        principalTable: "ProjectTasks",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_UserActivityLogs_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id");
                });

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "0713ae1b-c1c4-45f5-b4f0-cbd98977ee9a",
                column: "ConcurrencyStamp",
                value: "86df01a3-56e1-4af4-8ca2-97caa6d898f9");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "8450e6c0-e5a6-41b2-8957-978998ebdaeb",
                column: "ConcurrencyStamp",
                value: "87d4293f-231e-4b30-89f7-effb8ed39c15");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "ca1b544d-b871-4344-a8bd-d73d30a36307",
                column: "ConcurrencyStamp",
                value: "e058665e-812c-4bc0-9c43-a1cdff583c18");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "1a5ef115-89dc-483c-8539-f82f89250cc3",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "77b6ee4c-cf0e-4920-b99a-1a10e65e3043", "AQAAAAIAAYagAAAAEHrtoMksOG3ssUKxbeXnYl86XnkmqG6lcSYK4u1/jVJS3aKTSWBkDtw2om1BHEoRgw==", "478f24ec-462b-417c-9af3-fd80bf8e126d" });

            migrationBuilder.CreateIndex(
                name: "IX_UserActivityLogs_ProjectId",
                table: "UserActivityLogs",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_UserActivityLogs_TaskId",
                table: "UserActivityLogs",
                column: "TaskId");

            migrationBuilder.CreateIndex(
                name: "IX_UserActivityLogs_UserId",
                table: "UserActivityLogs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "UserActivityLogs");

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
        }
    }
}
