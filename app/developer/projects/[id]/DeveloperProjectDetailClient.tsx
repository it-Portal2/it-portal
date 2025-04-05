"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  FileText,
  Clock,
  CheckSquare,
  Sparkles,
  BarChart,
  Download,
  CircleDashed,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { toast } from "sonner";
import { Project, ClientTask, Task } from "@/lib/types";
import { format } from "date-fns";
import {
  getTasksAction,
  setProgressTypeAction,
  updateProjectProgressAction,
  createTasksAction,
  updateTaskStatusAction,
} from "@/app/actions/developer-actions";
import { generateTasksFromDeveloperDocumentation } from "@/app/actions/upload-actions";

interface ProjectDetailClientProps {
  project: Project | null;
  error: string | null;
}

export default function DeveloperProjectDetailClient({
  project,
  error: initialError,
}: ProjectDetailClientProps) {
  const [tasks, setTasks] = useState<ClientTask[]>([]);
  const [manualProgress, setManualProgress] = useState<number>(
    project?.progress || 0
  );
  const [localProgress, setLocalProgress] = useState<number>(
    project?.progress || 0
  ); // Local progress state
  const [loadingTasks, setLoadingTasks] = useState<boolean>(false);
  const [generatingTasks, setGeneratingTasks] = useState<boolean>(false);

  useEffect(() => {
    setLocalProgress(project?.progress || 0);
  }, [project?.progress]);
  // Fetch tasks if project is task-based
  useEffect(() => {
    if (project && project.progressType === "task-based") {
      const fetchTasks = async () => {
        setLoadingTasks(true);
        try {
          const tasksResult = await getTasksAction(project.id);
          if (tasksResult.success && tasksResult.data) {
            const clientTasks = tasksResult.data.map((task: Task) => ({
              id: task.id,
              name: task.name,
              completed: task.status === "completed",
            }));
            setTasks(clientTasks);
          } else {
            toast.error(tasksResult.error || "Failed to load tasks");
          }
        } catch (error) {
          toast.error("An unexpected error occurred while loading tasks");
        } finally {
          setLoadingTasks(false);
        }
      };
      fetchTasks();
    }
  }, [project]);

  const deadlineDate = project?.deadline ? new Date(project.deadline) : null;
  const today = new Date();
  const ifCompleted = project?.status === "completed"; // Check both possible completed states
  let timeDifference = 0;
  let daysLeft = 0;
  let isDeadlinePassed = false;
  let daysPastDeadline = 0;

  if (!ifCompleted && deadlineDate) {
    timeDifference =
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    daysLeft = Math.ceil(timeDifference);
    isDeadlinePassed = daysLeft < 0;
    daysPastDeadline = isDeadlinePassed ? Math.abs(daysLeft) : 0;
  }
  // const calculateTaskProgress = (): number => {
  //   if (tasks.length === 0) return 0;
  //   const completedCount = tasks.filter((task) => task.completed).length;
  //   return Math.round((completedCount / tasks.length) * 100);
  // };

  const handleTaskToggle = async (taskId: string) => {
    if (!project || project.isCompleted) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task) {
      toast.error("Task not found");
      return;
    }

    const newCompleted = !task.completed;

    // Optimistically update tasks state
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, completed: newCompleted } : t
    );
    setTasks(updatedTasks);

    // Calculate progress immediately after state update
    const completedCount = updatedTasks.filter((t) => t.completed).length;
    const newProgress = Math.round(
      (completedCount / updatedTasks.length) * 100
    );

    // console.log("Task ID:", taskId);
    // console.log("New Completed:", newCompleted);
    // console.log("Updated Tasks:", updatedTasks);
    // console.log("Completed Count:", completedCount);
    // console.log("New Progress:", newProgress);

    // Update task status in Firebase
    const newStatus = newCompleted ? "completed" : "not-started";
    const updateResult = await updateTaskStatusAction(
      taskId,
      newStatus,
      project.id,
      `/developer/projects/${project.id}`
    );

    if (!updateResult.success) {
      toast.error(updateResult.error || "Failed to update task");
      // Rollback on failure
      setTasks(tasks); // Reset to original tasks
      return;
    }

    // Update project progress in Firebase
    const progressResult = await updateProjectProgressAction(
      project.id,
      newProgress,
      undefined,
      `/developer/projects/${project.id}`
    );

    if (progressResult.success) {
      setLocalProgress(newProgress); // Update local progress for UI
      toast.success(`Task updated. Progress now at ${newProgress}%`);
      if (newProgress === 100) {
        toast.success("Project completed! No further changes allowed.");
      }
    } else {
      toast.error(progressResult.error || "Failed to update progress");
      // Rollback task change on progress update failure
      setTasks(tasks); // Reset to original tasks
      setLocalProgress(project?.progress || 0); // Reset local progress
    }
  };
  const handleGenerateTasks = async () => {
    if (!project || project.progressType || !project.cloudinaryDocumentationUrl)
      return;

    setGeneratingTasks(true);
    toast.loading("Analyzing documentation and generating tasks...", {
      id: "generate-tasks",
    });

    try {
      const typeResult = await setProgressTypeAction(
        project.id,
        "task-based",
        `/developer/projects/${project.id}`
      );
      if (!typeResult.success) {
        throw new Error(typeResult.error || "Failed to set progress type");
      }

      const aiGeneratedTasks = await generateTasksFromDeveloperDocumentation(
        project.cloudinaryDocumentationUrl
      );
      const firebaseTasks: Task[] = aiGeneratedTasks.map((task) => ({
        ...task,
        projectId: project.id,
        projectName: project.projectName,
        status: "not-started",
      }));

      const createResult = await createTasksAction(firebaseTasks, project.id); // Pass projectId
      if (!createResult.success) {
        throw new Error(createResult.error || "Failed to store tasks");
      }

      setTasks(aiGeneratedTasks);
      toast.success("Tasks generated and stored successfully!", {
        id: "generate-tasks",
      });
    } catch (error) {
      toast.error(
        `Task generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        { id: "generate-tasks" }
      );
    } finally {
      setGeneratingTasks(false);
    }
  };

  const handleSkipTaskList = async () => {
    if (!project || project.progressType) return;

    const typeResult = await setProgressTypeAction(
      project.id,
      "manual",
      `/developer/projects/${project.id}`
    );
    if (typeResult.success) {
      toast.success("Switched to manual progress mode.");
    } else {
      toast.error(typeResult.error || "Failed to set progress type");
    }
  };

  const handleUpdateManualProgress = async () => {
    if (!project || project.isCompleted) return;

    if (manualProgress <= project.progress) {
      toast.error("Progress must be greater than current value!");
      return;
    }
    if (manualProgress < 0 || manualProgress > 100) {
      toast.error("Progress must be between 0 and 100!");
      return;
    }

    const progressResult = await updateProjectProgressAction(
      project.id,
      manualProgress,
      undefined,
      `/developer/projects/${project.id}`
    );
    if (progressResult.success) {
      setManualProgress(manualProgress);
      toast.success(`Progress updated to ${manualProgress}%`);
      if (manualProgress === 100) {
        toast.success("Project completed! No further changes allowed.");
      }
    } else {
      toast.error(progressResult.error || "Failed to update progress");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (initialError) return <div>Error: {initialError}</div>;
  if (!project) return <div>Project not found</div>;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="mb-6">
        <Link href={"/developer/projects"}>
          <Button
            variant="outline"
            size="sm"
            className="mb-2 border-primary/20 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to all Projects
          </Button>
        </Link>
      </div>

      {/* Project Status Overview */}
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <Card className="glassmorphism shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span>Progress</span>
                <span className="font-medium">{localProgress}%</span>
              </div>
              <Progress value={project.progress} className="h-2 w-full" />
              <div className="pt-2 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Deadline
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {project.deadline
                      ? format(new Date(project.deadline), "MMMM dd, yyyy")
                      : "Not set"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Time Left
                    </span>
                  </div>
                  <Badge
                    variant={
                      !ifCompleted && (isDeadlinePassed || daysLeft < 5)
                        ? "destructive"
                        : "outline"
                    }
                    className="text-xs"
                  >
                    {ifCompleted
                      ? "Project Completed"
                      : deadlineDate
                      ? isDeadlinePassed
                        ? `Deadline crossed (${daysPastDeadline} day${
                            daysPastDeadline === 1 ? "" : "s"
                          })`
                        : `${daysLeft} days left`
                      : "Not set"}
                  </Badge>
                </div>
                {project.progressType === "task-based" && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Tasks
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {tasks.filter((t) => t.completed).length} of{" "}
                      {tasks.length} completed
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glassmorphism shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Project Files</CardTitle>
          </CardHeader>
          <CardContent>
            {project.hasExistingDesign && project.designLink && (
              <Link
                href={project.designLink}
                className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium"> View Design</p>
                </div>
                <Download className="h-4 w-4" />
              </Link>
            )}
            <Link
              href={project.cloudinaryDocumentationUrl || "#"}
              className="flex justify-between items-center p-2 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">View Developer Guide PDF</p>
              </div>
              <Download className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Progress Type Selection */}
      {project.progressType === null && (
        <motion.div
          variants={itemVariants}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6 border shadow-sm"
        >
          {generatingTasks ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <svg
                  className="animate-spin h-8 w-8 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              </div>
              <p className="text-muted-foreground">
                Generating tasks from documentation...
              </p>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-xl font-semibold">
                  How would you like to track your progress?
                </h2>
                <p className="text-muted-foreground mt-2">
                  Choose your preferred method for managing tasks and tracking
                  progress
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20 hover:border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-2 text-primary" />
                      Generate Task List
                    </CardTitle>
                    <CardDescription>
                      Auto-generate tasks from the Developer PDF
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <CheckSquare className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span>
                          Automatically breaks down project into manageable
                          tasks
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckSquare className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span>
                          Track progress by checking off completed tasks
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckSquare className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span>
                          Progress percentage automatically calculated
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button className="w-full" onClick={handleGenerateTasks}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Tasks
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="cursor-pointer hover:shadow-md transition-shadow border-primary/20 hover:border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <BarChart className="h-5 w-5 mr-2 text-primary" />
                      Manual Progress
                    </CardTitle>
                    <CardDescription>
                      Skip task list and track progress manually
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start">
                        <CheckSquare className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span>Simple percentage-based progress tracking</span>
                      </li>
                      <li className="flex items-start">
                        <CheckSquare className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span>No need to check off individual tasks</span>
                      </li>
                      <li className="flex items-start">
                        <CheckSquare className="h-4 w-4 mr-2 text-green-500 shrink-0 mt-0.5" />
                        <span>Quickly update overall project status</span>
                      </li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleSkipTaskList}
                    >
                      <BarChart className="mr-2 h-4 w-4" />
                      Skip Task List
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Manual Progress Update */}
      {project.progressType === "manual" && (
        <motion.div variants={itemVariants}>
          <Card className="glassmorphism shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Update Progress</CardTitle>
              <CardDescription>
                Manually update the project progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="manual-progress"
                    className="text-sm mb-2 block"
                  >
                    Current Progress: {project.progress}%
                  </Label>
                  <div className="flex items-center gap-4">
                    <Progress value={project.progress} className="flex-1 h-2" />
                    <span className="text-sm font-medium w-10">
                      {project.progress}%
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-progress-input">Update Progress</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="manual-progress-input"
                      type="number"
                      min="0"
                      max="100"
                      value={manualProgress}
                      onChange={(e) =>
                        setManualProgress(parseInt(e.target.value) || 0)
                      }
                      className="w-24"
                      disabled={project.isCompleted}
                    />
                    <span className="text-sm">%</span>
                    <Button
                      onClick={handleUpdateManualProgress}
                      disabled={project.isCompleted}
                    >
                      Update
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Update the percentage to reflect your current progress (must
                    be greater than {project.progress}%).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tasks Tab Content */}
      {project.progressType === "task-based" && (
        <motion.div variants={itemVariants}>
          <Card className="glassmorphism shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg">Task Management</CardTitle>
              <CardDescription>Track your progress with tasks</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-6">
              {loadingTasks ? (
                <div className="text-center">
                  <svg
                    className="animate-spin h-8 w-8 text-primary mx-auto"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <p className="mt-2 text-muted-foreground">Loading tasks...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Task List</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {tasks.filter((t) => t.completed).length} of{" "}
                        {tasks.length} completed
                      </span>
                      <Progress value={project.progress} className="h-2 w-24" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <motion.div
                        key={task.id}
                        className={`flex items-start gap-2 p-3 rounded-md transition-colors ${
                          task.completed
                            ? "bg-green-50 dark:bg-green-950/20"
                            : "hover:bg-muted/50"
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleTaskToggle(task.id)}
                          id={`task-${task.id}`}
                          className={
                            task.completed
                              ? "border-green-500 text-green-500"
                              : ""
                          }
                          disabled={project.isCompleted}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label
                            htmlFor={`task-${task.id}`}
                            className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                              task.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {task.name}
                          </label>
                        </div>
                        <div className="ml-auto">
                          {task.completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <CircleDashed className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
