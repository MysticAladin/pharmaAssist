using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPromotionCustomerTargeting : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ApplyToChildCustomers",
                table: "Promotions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "CustomerId",
                table: "Promotions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Promotions_CustomerId",
                table: "Promotions",
                column: "CustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Promotions_Customers_CustomerId",
                table: "Promotions",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Promotions_Customers_CustomerId",
                table: "Promotions");

            migrationBuilder.DropIndex(
                name: "IX_Promotions_CustomerId",
                table: "Promotions");

            migrationBuilder.DropColumn(
                name: "ApplyToChildCustomers",
                table: "Promotions");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "Promotions");
        }
    }
}
