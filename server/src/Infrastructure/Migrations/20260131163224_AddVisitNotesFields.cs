using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVisitNotesFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AgreedDeals",
                table: "ExecutedVisits",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompetitionNotes",
                table: "ExecutedVisits",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GeneralComment",
                table: "ExecutedVisits",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgreedDeals",
                table: "ExecutedVisits");

            migrationBuilder.DropColumn(
                name: "CompetitionNotes",
                table: "ExecutedVisits");

            migrationBuilder.DropColumn(
                name: "GeneralComment",
                table: "ExecutedVisits");
        }
    }
}
