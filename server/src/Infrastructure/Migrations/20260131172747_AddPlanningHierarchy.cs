using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanningHierarchy : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MonthlyPlanId",
                table: "VisitPlans",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AnnualPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RepId = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TerritoryDescription = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AssignedCantons = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    RevenueTarget = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    VisitsTarget = table.Column<int>(type: "int", nullable: true),
                    NewCustomersTarget = table.Column<int>(type: "int", nullable: true),
                    MajorEvents = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    StrategicPriorities = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FocusProducts = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ApprovedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AnnualPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AnnualPlans_SalesRepresentatives_RepId",
                        column: x => x.RepId,
                        principalTable: "SalesRepresentatives",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QuarterlyPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    AnnualPlanId = table.Column<int>(type: "int", nullable: true),
                    RepId = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    Quarter = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RevenueTarget = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    VisitsTarget = table.Column<int>(type: "int", nullable: true),
                    NewCustomersTarget = table.Column<int>(type: "int", nullable: true),
                    CampaignSchedule = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainingSchedule = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ResourceAllocation = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    KeyObjectives = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FocusProducts = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ApprovedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuarterlyPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_QuarterlyPlans_AnnualPlans_AnnualPlanId",
                        column: x => x.AnnualPlanId,
                        principalTable: "AnnualPlans",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_QuarterlyPlans_SalesRepresentatives_RepId",
                        column: x => x.RepId,
                        principalTable: "SalesRepresentatives",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MonthlyPlans",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    QuarterlyPlanId = table.Column<int>(type: "int", nullable: true),
                    RepId = table.Column<int>(type: "int", nullable: false),
                    Year = table.Column<int>(type: "int", nullable: false),
                    Month = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RevenueTarget = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    VisitsTarget = table.Column<int>(type: "int", nullable: true),
                    TierACoverageTarget = table.Column<int>(type: "int", nullable: true),
                    TierBCoverageTarget = table.Column<int>(type: "int", nullable: true),
                    TierCCoverageTarget = table.Column<int>(type: "int", nullable: true),
                    PromotionalActivities = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainingSchedule = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FocusProducts = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PriorityCustomers = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ApprovedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ApprovedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ActualRevenue = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ActualVisits = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonthlyPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MonthlyPlans_QuarterlyPlans_QuarterlyPlanId",
                        column: x => x.QuarterlyPlanId,
                        principalTable: "QuarterlyPlans",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MonthlyPlans_SalesRepresentatives_RepId",
                        column: x => x.RepId,
                        principalTable: "SalesRepresentatives",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_VisitPlans_MonthlyPlanId",
                table: "VisitPlans",
                column: "MonthlyPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_AnnualPlans_RepId",
                table: "AnnualPlans",
                column: "RepId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyPlans_QuarterlyPlanId",
                table: "MonthlyPlans",
                column: "QuarterlyPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyPlans_RepId",
                table: "MonthlyPlans",
                column: "RepId");

            migrationBuilder.CreateIndex(
                name: "IX_QuarterlyPlans_AnnualPlanId",
                table: "QuarterlyPlans",
                column: "AnnualPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_QuarterlyPlans_RepId",
                table: "QuarterlyPlans",
                column: "RepId");

            migrationBuilder.AddForeignKey(
                name: "FK_VisitPlans_MonthlyPlans_MonthlyPlanId",
                table: "VisitPlans",
                column: "MonthlyPlanId",
                principalTable: "MonthlyPlans",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_VisitPlans_MonthlyPlans_MonthlyPlanId",
                table: "VisitPlans");

            migrationBuilder.DropTable(
                name: "MonthlyPlans");

            migrationBuilder.DropTable(
                name: "QuarterlyPlans");

            migrationBuilder.DropTable(
                name: "AnnualPlans");

            migrationBuilder.DropIndex(
                name: "IX_VisitPlans_MonthlyPlanId",
                table: "VisitPlans");

            migrationBuilder.DropColumn(
                name: "MonthlyPlanId",
                table: "VisitPlans");
        }
    }
}
