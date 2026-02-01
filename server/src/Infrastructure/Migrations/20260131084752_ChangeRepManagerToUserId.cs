using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ChangeRepManagerToUserId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RepManagerAssignments_SalesRepresentatives_ManagerId",
                table: "RepManagerAssignments");

            migrationBuilder.DropIndex(
                name: "IX_RepManagerAssignments_ManagerId",
                table: "RepManagerAssignments");

            migrationBuilder.DropIndex(
                name: "IX_RepManagerAssignments_RepId_ManagerId",
                table: "RepManagerAssignments");

            migrationBuilder.DropColumn(
                name: "ManagerId",
                table: "RepManagerAssignments");

            migrationBuilder.AddColumn<string>(
                name: "ManagerUserId",
                table: "RepManagerAssignments",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_RepManagerAssignments_ManagerUserId",
                table: "RepManagerAssignments",
                column: "ManagerUserId");

            migrationBuilder.CreateIndex(
                name: "IX_RepManagerAssignments_RepId_ManagerUserId",
                table: "RepManagerAssignments",
                columns: new[] { "RepId", "ManagerUserId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_RepManagerAssignments_Users_ManagerUserId",
                table: "RepManagerAssignments",
                column: "ManagerUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_RepManagerAssignments_Users_ManagerUserId",
                table: "RepManagerAssignments");

            migrationBuilder.DropIndex(
                name: "IX_RepManagerAssignments_ManagerUserId",
                table: "RepManagerAssignments");

            migrationBuilder.DropIndex(
                name: "IX_RepManagerAssignments_RepId_ManagerUserId",
                table: "RepManagerAssignments");

            migrationBuilder.DropColumn(
                name: "ManagerUserId",
                table: "RepManagerAssignments");

            migrationBuilder.AddColumn<int>(
                name: "ManagerId",
                table: "RepManagerAssignments",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_RepManagerAssignments_ManagerId",
                table: "RepManagerAssignments",
                column: "ManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_RepManagerAssignments_RepId_ManagerId",
                table: "RepManagerAssignments",
                columns: new[] { "RepId", "ManagerId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_RepManagerAssignments_SalesRepresentatives_ManagerId",
                table: "RepManagerAssignments",
                column: "ManagerId",
                principalTable: "SalesRepresentatives",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
