using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesRepOrderAttribution : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApprovalComments",
                table: "VisitPlans",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "CreatedViaApp",
                table: "Orders",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "OfflineCreatedAt",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RepDeviceId",
                table: "Orders",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "RepId",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SyncedAt",
                table: "Orders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VisitId",
                table: "Orders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "CustomerAddresses",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "CustomerAddresses",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_RepId",
                table: "Orders",
                column: "RepId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_VisitId",
                table: "Orders",
                column: "VisitId");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_ExecutedVisits_VisitId",
                table: "Orders",
                column: "VisitId",
                principalTable: "ExecutedVisits",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_SalesRepresentatives_RepId",
                table: "Orders",
                column: "RepId",
                principalTable: "SalesRepresentatives",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_ExecutedVisits_VisitId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_SalesRepresentatives_RepId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_RepId",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_VisitId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "ApprovalComments",
                table: "VisitPlans");

            migrationBuilder.DropColumn(
                name: "CreatedViaApp",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "OfflineCreatedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RepDeviceId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "RepId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "SyncedAt",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "VisitId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "CustomerAddresses");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "CustomerAddresses");
        }
    }
}
