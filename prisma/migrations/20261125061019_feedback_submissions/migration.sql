-- CreateTable
CREATE TABLE "questionnaire_assignments" (
    "id" TEXT NOT NULL,
    "questionnaireId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questionnaire_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_submissions" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "submission_answers" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "submission_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "questionnaire_assignments_userId_idx" ON "questionnaire_assignments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "questionnaire_assignments_questionnaireId_userId_key" ON "questionnaire_assignments"("questionnaireId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_submissions_assignmentId_key" ON "feedback_submissions"("assignmentId");

-- CreateIndex
CREATE INDEX "submission_answers_questionId_idx" ON "submission_answers"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "submission_answers_submissionId_questionId_key" ON "submission_answers"("submissionId", "questionId");

-- AddForeignKey
ALTER TABLE "questionnaire_assignments" ADD CONSTRAINT "questionnaire_assignments_questionnaireId_fkey" FOREIGN KEY ("questionnaireId") REFERENCES "questionnaires"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_assignments" ADD CONSTRAINT "questionnaire_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questionnaire_assignments" ADD CONSTRAINT "questionnaire_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_submissions" ADD CONSTRAINT "feedback_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "questionnaire_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "feedback_submissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submission_answers" ADD CONSTRAINT "submission_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
