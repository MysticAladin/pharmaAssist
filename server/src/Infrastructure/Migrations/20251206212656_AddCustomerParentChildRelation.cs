using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerParentChildRelation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BranchCode",
                table: "Customers",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsHeadquarters",
                table: "Customers",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ParentCustomerId",
                table: "Customers",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Customers_ParentCustomerId",
                table: "Customers",
                column: "ParentCustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_Customers_Customers_ParentCustomerId",
                table: "Customers",
                column: "ParentCustomerId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Customers_Customers_ParentCustomerId",
                table: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_Customers_ParentCustomerId",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "BranchCode",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "IsHeadquarters",
                table: "Customers");

            migrationBuilder.DropColumn(
                name: "ParentCustomerId",
                table: "Customers");
        }
    }
}
