using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SzakDolgozat.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "ProjectTasks",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "ProjectTasks",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Projects",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Projects",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "0713ae1b-c1c4-45f5-b4f0-cbd98977ee9a",
                column: "ConcurrencyStamp",
                value: "0f721cbe-eea9-462f-aa79-74973fcdd108");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "8450e6c0-e5a6-41b2-8957-978998ebdaeb",
                column: "ConcurrencyStamp",
                value: "433588f7-c082-42f6-98f9-67041f0b5a85");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "ca1b544d-b871-4344-a8bd-d73d30a36307",
                column: "ConcurrencyStamp",
                value: "61e1985d-324d-4c60-83ed-2baa85a6bb56");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "1a5ef115-89dc-483c-8539-f82f89250cc3",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "7cb87182-52a7-4014-a69f-984f31aac862", "AQAAAAIAAYagAAAAENdHI9zrDHawPggBzuNnyGowxP6pn+Qt3Jlfpg9Kv61Shzbsb6Sa5Aaf+zS8YiLg4A==", "2703a038-6959-444f-8084-7cc27b0670dc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Projects");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "0713ae1b-c1c4-45f5-b4f0-cbd98977ee9a",
                column: "ConcurrencyStamp",
                value: "cc9eb879-3c50-417c-8f4c-e13a96817513");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "8450e6c0-e5a6-41b2-8957-978998ebdaeb",
                column: "ConcurrencyStamp",
                value: "4c8c8dbe-aad5-43c3-bfd2-16566d93136b");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "ca1b544d-b871-4344-a8bd-d73d30a36307",
                column: "ConcurrencyStamp",
                value: "49d6446e-9e64-4ae9-9ba9-37b7946b6de0");

            migrationBuilder.UpdateData(
                table: "AspNetUsers",
                keyColumn: "Id",
                keyValue: "1a5ef115-89dc-483c-8539-f82f89250cc3",
                columns: new[] { "ConcurrencyStamp", "PasswordHash", "SecurityStamp" },
                values: new object[] { "49bb9c9f-e926-47a4-bc03-825548bfd011", "AQAAAAIAAYagAAAAENCbFVf/ZTs9X6nddh5CWEKTX7nYfNT1ylJAAYTNy6AJmoqk9OjC5Frrx89N5KGNPQ==", "e34c2aed-8322-49bc-a939-067e83b696bc" });
        }
    }
}
