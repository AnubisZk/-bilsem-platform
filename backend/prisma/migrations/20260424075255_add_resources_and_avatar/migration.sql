-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('ATANDI', 'DEVAM_EDIYOR', 'TAMAMLANDI', 'GECIKTI');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('KOLAY', 'ORTA', 'ZOR');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "StudentResource" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "driveFileId" TEXT NOT NULL,
    "driveUrl" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "status" "ResourceStatus" NOT NULL DEFAULT 'ATANDI',
    "isVisible" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceAiPlan" (
    "id" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "totalEstimatedQuestions" INTEGER NOT NULL DEFAULT 0,
    "generatedByAI" BOOLEAN NOT NULL DEFAULT true,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceAiPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourcePlanItem" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "subtopic" TEXT,
    "description" TEXT,
    "estimatedQuestionCount" INTEGER NOT NULL DEFAULT 0,
    "suggestedDuration" INTEGER NOT NULL DEFAULT 30,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "teacherNote" TEXT,
    "studentGoal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourcePlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentPlanProgress" (
    "id" TEXT NOT NULL,
    "planItemId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "solvedCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "wrongCount" INTEGER NOT NULL DEFAULT 0,
    "blankCount" INTEGER NOT NULL DEFAULT 0,
    "difficultyLevel" "DifficultyLevel",
    "studentNote" TEXT,
    "teacherFeedback" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentPlanProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResourceAiPlan_resourceId_key" ON "ResourceAiPlan"("resourceId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentPlanProgress_planItemId_studentId_key" ON "StudentPlanProgress"("planItemId", "studentId");

-- AddForeignKey
ALTER TABLE "StudentResource" ADD CONSTRAINT "StudentResource_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentResource" ADD CONSTRAINT "StudentResource_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceAiPlan" ADD CONSTRAINT "ResourceAiPlan_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "StudentResource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourcePlanItem" ADD CONSTRAINT "ResourcePlanItem_planId_fkey" FOREIGN KEY ("planId") REFERENCES "ResourceAiPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPlanProgress" ADD CONSTRAINT "StudentPlanProgress_planItemId_fkey" FOREIGN KEY ("planItemId") REFERENCES "ResourcePlanItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
