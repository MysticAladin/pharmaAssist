using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWarehouseIdToProductBatch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // First add the column as nullable
            migrationBuilder.AddColumn<int>(
                name: "WarehouseId",
                table: "ProductBatches",
                type: "int",
                nullable: true);

            // Update existing batches to use the default warehouse (CENTRAL)
            migrationBuilder.Sql(@"
                UPDATE ProductBatches 
                SET WarehouseId = (SELECT TOP 1 Id FROM Warehouses WHERE IsDefault = 1)
                WHERE WarehouseId IS NULL;
                
                -- If no default warehouse, use the first warehouse
                UPDATE ProductBatches 
                SET WarehouseId = (SELECT TOP 1 Id FROM Warehouses ORDER BY Id)
                WHERE WarehouseId IS NULL;
            ");

            // Now make the column non-nullable
            migrationBuilder.AlterColumn<int>(
                name: "WarehouseId",
                table: "ProductBatches",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProductBatches_WarehouseId",
                table: "ProductBatches",
                column: "WarehouseId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProductBatches_Warehouses_WarehouseId",
                table: "ProductBatches",
                column: "WarehouseId",
                principalTable: "Warehouses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);  // Restrict instead of Cascade to prevent accidental deletion
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProductBatches_Warehouses_WarehouseId",
                table: "ProductBatches");

            migrationBuilder.DropIndex(
                name: "IX_ProductBatches_WarehouseId",
                table: "ProductBatches");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "ProductBatches");
        }
    }
}
