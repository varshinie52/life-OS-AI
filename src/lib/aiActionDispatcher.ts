'use client';

import { LifeOSContextType } from '@/context/LifeOSContext';
import { getToday } from '@/lib/utils';

export interface ActionResult {
  handled: boolean;
  reply: string;
  actionExecuted?: string;
  requiresConfirmation?: boolean;
  pendingAction?: {
    action: string;
    payload: Record<string, any>;
    confirmText: string;
  };
}

export function parseAndExecuteAIAction(
  message: string,
  lifeOS: LifeOSContextType,
  isConfirmed: boolean = false
): ActionResult {
  const text = message.trim().toLowerCase();
  const todayStr = getToday();

  // Helper date utility
  const getRelativeDateStr = (offsetDays: number = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  // Helper date parsing (tomorrow, friday, etc.)
  const parseTargetDate = (rawText: string): string => {
    const lower = rawText.toLowerCase();
    if (lower.includes('tomorrow')) return getRelativeDateStr(1);
    if (lower.includes('yesterday')) return getRelativeDateStr(-1);
    if (lower.includes('today')) return todayStr;

    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (let i = 0; i < 7; i++) {
      if (lower.includes(daysOfWeek[i])) {
        const todayDay = new Date().getDay();
        let targetDay = i;
        let diff = targetDay - todayDay;
        if (diff <= 0) diff += 7;
        return getRelativeDateStr(diff);
      }
    }
    return todayStr;
  };

  // ── DESTRUCTIVE ACTIONS SAFETIES ──────────────────────────────────
  if (text.includes('delete all tasks') || text.includes('clear all tasks')) {
    if (!isConfirmed) {
      return {
        handled: true,
        reply: `⚠️ **Action Required**: Are you sure you want to delete **ALL** your tasks? This action cannot be undone.`,
        requiresConfirmation: true,
        pendingAction: {
          action: 'clearAllTasks',
          payload: {},
          confirmText: 'Yes, delete all tasks',
        },
      };
    } else {
      lifeOS.clearAllTasks();
      return {
        handled: true,
        reply: `✓ **All tasks deleted.** Your task board has been reset.`,
        actionExecuted: 'clearAllTasks',
      };
    }
  }

  if (text.includes('delete all habits') || text.includes('clear all habits')) {
    if (!isConfirmed) {
      return {
        handled: true,
        reply: `⚠️ **Action Required**: Are you sure you want to delete **ALL** your habits and streak data?`,
        requiresConfirmation: true,
        pendingAction: {
          action: 'clearAllHabits',
          payload: {},
          confirmText: 'Yes, delete all habits',
        },
      };
    } else {
      lifeOS.clearAllHabits();
      return {
        handled: true,
        reply: `✓ **All habits cleared.** Your habit tracker has been reset.`,
        actionExecuted: 'clearAllHabits',
      };
    }
  }

  if (text.includes('delete all notes') || text.includes('clear all notes')) {
    if (!isConfirmed) {
      return {
        handled: true,
        reply: `⚠️ **Action Required**: Are you sure you want to delete **ALL** your notes?`,
        requiresConfirmation: true,
        pendingAction: {
          action: 'clearAllNotes',
          payload: {},
          confirmText: 'Yes, delete all notes',
        },
      };
    } else {
      lifeOS.clearAllNotes();
      return {
        handled: true,
        reply: `✓ **All notes deleted.**`,
        actionExecuted: 'clearAllNotes',
      };
    }
  }

  if (text.includes('delete all journal') || text.includes('clear all journal')) {
    if (!isConfirmed) {
      return {
        handled: true,
        reply: `⚠️ **Action Required**: Are you sure you want to delete **ALL** your journal entries?`,
        requiresConfirmation: true,
        pendingAction: {
          action: 'clearAllJournalEntries',
          payload: {},
          confirmText: 'Yes, delete all journal entries',
        },
      };
    } else {
      lifeOS.clearAllJournalEntries();
      return {
        handled: true,
        reply: `✓ **All journal entries deleted.**`,
        actionExecuted: 'clearAllJournalEntries',
      };
    }
  }

  // ── READ CONTEXT / ACCOMPLISHMENT INQUIRIES ─────────────────────────
  if (
    text.includes('accomplish') ||
    text.includes('what did i do today') ||
    text.includes('summary of today') ||
    text.includes('my progress today') ||
    text === 'what did i accomplish today?' ||
    text === 'what did i accomplish today'
  ) {
    const { metrics } = lifeOS;
    return {
      handled: true,
      reply:
        `### Today's LifeOS Summary ☀️\n\n` +
        `**Habits Logged:** ${metrics.habitsCompletedToday} / ${metrics.habitsTotalToday} (${metrics.habitCompletionRate}%)\n` +
        `**Tasks Done:** ${metrics.tasksCompleted} / ${metrics.tasksTotal} (${metrics.taskCompletionRate}%)\n` +
        `**Journal Status:** ${metrics.journalTodayEntry ? '✓ Entry written (' + metrics.journalTodayEntry.mood + ')' : 'Pending'}\n` +
        `**Upcoming Events Today:** ${metrics.todayEvents.length} scheduled\n` +
        `**Active Streak:** ${metrics.currentHabitStreak} Days 🔥\n\n` +
        `**Overall Output Score:** **${metrics.productivityScore}%**`,
    };
  }

  if (text.includes('what did i do yesterday') || text.includes('summary of yesterday') || text.includes('yesterday\'s progress')) {
    const yStr = getRelativeDateStr(-1);
    const habitsYesterday = lifeOS.habits.filter(h => h.completedDates.includes(yStr));
    const tasksYesterday = lifeOS.tasks.filter(t => t.status === 'done' && t.completedAt && t.completedAt.startsWith(yStr));
    const journalYesterday = lifeOS.journal.find(j => j.date === yStr);

    let yReply = `### 🌙 Yesterday's Activity Summary (${yStr})\n\n`;
    yReply += `**Habits Completed (${habitsYesterday.length}):**\n` + (habitsYesterday.length > 0 ? habitsYesterday.map(h => `• ${h.icon} ${h.name}`).join('\n') : 'No habits logged yesterday') + `\n\n`;
    yReply += `**Tasks Finished (${tasksYesterday.length}):**\n` + (tasksYesterday.length > 0 ? tasksYesterday.map(t => `• ${t.title}`).join('\n') : 'No tasks completed yesterday') + `\n\n`;
    if (journalYesterday) {
      yReply += `**Journal Entry:** Logged with mood ${journalYesterday.mood} — "${journalYesterday.content.slice(0, 80)}..."\n`;
    } else {
      yReply += `**Journal Entry:** None logged for yesterday.\n`;
    }

    return { handled: true, reply: yReply };
  }

  // ── TASKS ACTIONS ──────────────────────────────────────────────────
  // 1. Show pending tasks
  if (text.includes('show pending tasks') || text.includes('list tasks') || text.includes('view tasks') || text.includes('review my tasks')) {
    const pending = lifeOS.tasks.filter((t) => t.status !== 'done');
    if (pending.length === 0) {
      return {
        handled: true,
        reply: `🎉 You have **no pending tasks** right now! All caught up.`,
      };
    }
    const listStr = pending
      .slice(0, 7)
      .map((t) => `• **${t.title}** (${t.priority.toUpperCase()} priority${t.dueDate ? ' · Due: ' + t.dueDate : ''})`)
      .join('\n');
    return {
      handled: true,
      reply: `📋 **Here are your pending tasks (${pending.length} total):**\n\n${listStr}`,
    };
  }

  // 2. Complete / Mark Task Done
  if (text.includes('mark') && (text.includes('task') || text.includes('as completed') || text.includes('as done') || text.includes('finish'))) {
    // Extract task query
    let target = message.replace(/mark/i, '').replace(/task/i, '').replace(/as completed/i, '').replace(/as done/i, '').replace(/finish/i, '').replace(/my/i, '').replace(/complete/i, '').trim();
    if (!target) target = 'react';

    const matchedTask = lifeOS.tasks.find((t) => t.title.toLowerCase().includes(target.toLowerCase()));
    if (matchedTask) {
      lifeOS.updateTask(matchedTask.id, { status: 'done' });
      return {
        handled: true,
        reply: `✓ **Task completed!**\n\n**${matchedTask.title}**\nStatus: Done 🎉`,
        actionExecuted: 'updateTask',
      };
    }
  }

  // 3. Delete Task
  if ((text.includes('delete task') || text.includes('remove task')) && !text.includes('delete all')) {
    const target = message.replace(/delete task/i, '').replace(/remove task/i, '').trim();
    const matchedTask = lifeOS.tasks.find((t) => t.title.toLowerCase().includes(target.toLowerCase()));
    if (matchedTask) {
      lifeOS.deleteTask(matchedTask.id);
      return {
        handled: true,
        reply: `✓ **Task deleted:** "${matchedTask.title}"`,
        actionExecuted: 'deleteTask',
      };
    }
  }

  // 4. Create / Add Task
  if (text.startsWith('add a task') || text.startsWith('add task') || text.startsWith('create task') || text.startsWith('create a task') || text.includes('dsa task') || text.includes('react task')) {
    let rawTitle = message
      .replace(/add a task to/i, '')
      .replace(/add a task/i, '')
      .replace(/add task/i, '')
      .replace(/create a task for/i, '')
      .replace(/create a task/i, '')
      .replace(/create task/i, '')
      .replace(/for tomorrow/i, '')
      .replace(/today/i, '')
      .replace(/tomorrow/i, '')
      .trim();

    if (!rawTitle) rawTitle = 'New LifeOS Task';

    // Capitalize nicely
    const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
    const targetDate = parseTargetDate(message);
    const category = text.includes('dsa') || text.includes('study') ? 'Education' : text.includes('react') || text.includes('code') ? 'Work' : 'Personal';

    const newTask = lifeOS.addTask(cleanTitle, 'Created via LifeOS AI Assistant', 'medium', category, targetDate);

    return {
      handled: true,
      reply: `✓ **Task added**\n\n**${newTask.title}**\nDue: ${targetDate}\nCategory: ${category}`,
      actionExecuted: 'addTask',
    };
  }

  // ── HABITS ACTIONS ─────────────────────────────────────────────────
  // 1. Mark habit complete
  if (text.includes('mark') && (text.includes('habit') || text.includes('dsa') || text.includes('exercise') || text.includes('water') || text.includes('read'))) {
    const target = text.replace(/mark/i, '').replace(/as completed/i, '').replace(/as complete/i, '').replace(/habit/i, '').replace(/my/i, '').trim();

    const matchedHabit = lifeOS.habits.find((h) => h.name.toLowerCase().includes(target));
    if (matchedHabit) {
      lifeOS.toggleHabitCompletion(matchedHabit.id, todayStr);
      return {
        handled: true,
        reply: `✓ **Habit logged!**\n\n${matchedHabit.icon} **${matchedHabit.name}**\nLogged for today (${todayStr}) 🔥`,
        actionExecuted: 'toggleHabitCompletion',
      };
    }
  }

  // 2. Show streaks & list habits
  if (text.includes('streak') || text.includes('my streaks') || text === 'show my habits' || text.includes('list habits') || text.includes('view habits')) {
    const list = lifeOS.habits
      .map((h) => `${h.icon} **${h.name}**: ${h.completedDates.length} total completions (${h.completedDates.includes(todayStr) ? 'Done today ✓' : 'Pending today'})`)
      .join('\n');

    return {
      handled: true,
      reply: `🔥 **Your Active Habits & Streaks (${lifeOS.habits.length} total):**\n\n${list}\n\nCurrent Best Streak: **${lifeOS.metrics.currentHabitStreak} Days**!`,
    };
  }

  // 3. Add Habit (Supports "add dsa into habit", "add dsa habit", "add dsa to habit", "create habit dsa", etc.)
  if (
    text.includes('add') && (text.includes('habit') || text.includes('into habit') || text.includes('to habit')) ||
    text.includes('create') && (text.includes('habit') || text.includes('into habit')) ||
    text.startsWith('add habit') || text.startsWith('create habit')
  ) {
    let nameStr = message
      .replace(/add/i, '')
      .replace(/create/i, '')
      .replace(/into habit/i, '')
      .replace(/to habit/i, '')
      .replace(/in habit/i, '')
      .replace(/into habits/i, '')
      .replace(/to habits/i, '')
      .replace(/a habit/i, '')
      .replace(/habit/i, '')
      .trim();

    let name = nameStr.charAt(0).toUpperCase() + nameStr.slice(1);
    if (!name || name.length < 2) name = 'DSA Practice';
    if (name.toLowerCase() === 'dsa') name = 'DSA Practice';

    // Check if habit already exists
    const existing = lifeOS.habits.find(h => h.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return {
        handled: true,
        reply: `🎯 Habit **${existing.name}** already exists in your LifeOS tracker!\n\nIcon: ${existing.icon}\nCompleted dates logged: ${existing.completedDates.length} days`,
      };
    }

    const icon = name.toLowerCase().includes('dsa') || name.toLowerCase().includes('code') ? '💻' : name.toLowerCase().includes('run') || name.toLowerCase().includes('exercise') ? '🏃‍♂️' : '🎯';
    const newHabit = lifeOS.addHabit(name, icon, '#6B7F4E');
    return {
      handled: true,
      reply: `✓ **Habit created!**\n\n${newHabit.icon} **${newHabit.name}**\nCategory: Daily Habit\n\nIt is now live on your **Habits**, **Dashboard**, **Calendar**, and **Analytics**!`,
      actionExecuted: 'addHabit',
    };
  }

  // 4. "What should I do today?"
  if (text.includes('what should i do today') || text.includes('today\'s focus') || text.includes('what to do today')) {
    const pendingTasks = lifeOS.tasks.filter(t => t.status !== 'done');
    const pendingHabits = lifeOS.habits.filter(h => !h.completedDates.includes(todayStr));
    const eventsToday = lifeOS.events.filter(e => e.date === todayStr);

    let planReply = `### 🎯 Your Action Plan for Today (${todayStr})\n\n`;
    if (eventsToday.length > 0) {
      planReply += `**📅 Scheduled Events:**\n` + eventsToday.map(e => `• **${e.title}** (${e.startTime} - ${e.endTime})`).join('\n') + `\n\n`;
    }
    if (pendingTasks.length > 0) {
      planReply += `**📋 Priority Tasks to Complete:**\n` + pendingTasks.slice(0, 3).map(t => `• **${t.title}** (${t.priority.toUpperCase()} priority)`).join('\n') + `\n\n`;
    }
    if (pendingHabits.length > 0) {
      planReply += `**🔥 Pending Habits for Today:**\n` + pendingHabits.slice(0, 4).map(h => `• ${h.icon} ${h.name}`).join('\n') + `\n\n`;
    }
    planReply += `*Focus on finishing high priority tasks first to boost your productivity score!*`;

    return { handled: true, reply: planReply };
  }

  // 5. "How am I doing?"
  if (text.includes('how am i doing') || text.includes('how is my progress') || text.includes('overall performance')) {
    const { metrics } = lifeOS;
    return {
      handled: true,
      reply: `### 📊 Your LifeOS Performance Overview\n\n` +
        `• **Productivity Score:** **${metrics.productivityScore}/100**\n` +
        `• **Active Habit Streak:** **${metrics.currentHabitStreak} Days 🔥**\n` +
        `• **Habits Completed Today:** ${metrics.habitsCompletedToday} / ${metrics.habitsTotalToday} (${metrics.habitCompletionRate}%)\n` +
        `• **Task Completion Rate:** ${metrics.taskCompletionRate}% (${metrics.tasksCompleted} done, ${metrics.tasksPending} pending)\n` +
        `• **Journal Consistency:** ${metrics.journalTodayEntry ? 'Logged today ✓' : 'Pending entry'}\n\n` +
        `*You are making strong, consistent progress! Keep up the momentum.*`,
    };
  }

  // ── NOTES ACTIONS ──────────────────────────────────────────────────
  if (text.includes('create a note') || text.includes('create note') || text.includes('new note') || text.includes('add note')) {
    let titleStr = message
      .replace(/create a note called/i, '')
      .replace(/create a note/i, '')
      .replace(/create note/i, '')
      .replace(/new note/i, '')
      .replace(/add note/i, '')
      .trim();

    let content = 'Created via LifeOS AI';
    if (titleStr.includes(':')) {
      const parts = titleStr.split(':');
      titleStr = parts[0];
      content = parts.slice(1).join(':').trim();
    }

    const title = titleStr.charAt(0).toUpperCase() + titleStr.slice(1) || 'Untitled Note';
    const newNote = lifeOS.addNote(title, content, 'General', '#4C6A73');

    return {
      handled: true,
      reply: `✓ **Note created!**\n\n📝 **${newNote.title}**\n${content}`,
      actionExecuted: 'addNote',
    };
  }

  if (text.includes('show my recent notes') || text.includes('show recent notes') || text.includes('list notes') || text.includes('my notes')) {
    if (lifeOS.notes.length === 0) {
      return { handled: true, reply: `📝 You don't have any notes created yet.` };
    }
    const notesStr = lifeOS.notes
      .slice(0, 5)
      .map((n) => `• **${n.title}** (${n.folder}) - *${n.content.slice(0, 40)}...*`)
      .join('\n');
    return {
      handled: true,
      reply: `📝 **Your Recent Notes:**\n\n${notesStr}`,
    };
  }

  // ── JOURNAL ACTIONS ────────────────────────────────────────────────
  if (text.includes('journal entry') || text.includes('create today\'s journal') || text.includes('add to today\'s journal')) {
    let content = message
      .replace(/create today's journal entry/i, '')
      .replace(/add this to today's journal:/i, '')
      .replace(/add to today's journal:/i, '')
      .replace(/journal entry:/i, '')
      .trim();

    if (!content) content = 'Today was productive and well spent working on LifeOS targets.';

    const entry = lifeOS.saveJournalEntry(todayStr, content, '😊', ['Growth', 'Health']);

    return {
      handled: true,
      reply: `✓ **Journal Entry Logged!**\n\nDate: ${entry.date}\nMood: ${entry.mood}\nContent: "${entry.content}"`,
      actionExecuted: 'saveJournalEntry',
    };
  }

  // ── CALENDAR ACTIONS ───────────────────────────────────────────────
  if (text.includes('add a mock interview') || text.includes('add event') || text.includes('schedule event') || text.includes('calendar event')) {
    const targetDate = parseTargetDate(message);
    let eventTitle = 'Mock Interview';

    if (message.toLowerCase().includes('interview')) eventTitle = 'Mock Technical Interview';
    else if (message.toLowerCase().includes('meeting')) eventTitle = 'Team Meeting';

    const newEvent = lifeOS.addCalendarEvent(eventTitle, 'Scheduled via LifeOS AI', targetDate, '10:00', '11:00', '#4C6A73');

    return {
      handled: true,
      reply: `✓ **Calendar Event Scheduled!**\n\n📅 **${newEvent.title}**\nDate: ${targetDate}\nTime: 10:00 AM - 11:00 AM`,
      actionExecuted: 'addCalendarEvent',
    };
  }

  if (text.includes('events tomorrow') || text.includes('what events') || text.includes('calendar tomorrow')) {
    const targetDate = parseTargetDate(message);
    const evs = lifeOS.events.filter((e) => e.date === targetDate);

    if (evs.length === 0) {
      return {
        handled: true,
        reply: `📅 No calendar events scheduled for **${targetDate}**.`,
      };
    }

    const evList = evs.map((e) => `• **${e.title}** (${e.startTime} - ${e.endTime})`).join('\n');
    return {
      handled: true,
      reply: `📅 **Events scheduled for ${targetDate}:**\n\n${evList}`,
    };
  }

  // Fallback for general conversation / query
  return {
    handled: false,
    reply: '',
  };
}
