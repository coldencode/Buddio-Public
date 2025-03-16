'use client';

import { useState, useEffect, use } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import Link from 'next/link';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Home, Star, Plus, Download, X } from 'lucide-react';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Priority constants
const PRIORITY_COLORS = {
  LOW: 'text-green-500 bg-green-50',
  MEDIUM: 'text-yellow-500 bg-yellow-50',
  HIGH: 'text-red-500 bg-red-50'
};

// Sample data structure for tickets with priority
const initialTickets = {
  todo: [
    { id: 'ticket-1', title: 'Task 1', description: 'Description 1', date: new Date(), priority: 'LOW' },
    { id: 'ticket-2', title: 'Task 2', description: 'Description 2', date: new Date(), priority: 'MEDIUM' },
  ],
  inProgress: [
    { id: 'ticket-3', title: 'Task 3', description: 'Description 3', date: new Date(), priority: 'HIGH' },
  ],
  done: [
    { id: 'ticket-4', title: 'Task 4', description: 'Description 4', date: new Date(), priority: 'MEDIUM' },
  ],
};

export default function CalendarPage({ params }) {
  const projectName = use(params).projectName;
  const [tickets, setTickets] = useState(initialTickets);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ 
    title: '', 
    description: '', 
    date: new Date(),
    priority: 'LOW'
  });
  const [view, setView] = useState('kanban');
  const [progress, setProgress] = useState({
    total: 0,
    completed: 0,
    percentage: 0
  });

  useEffect(() => {
    const totalTickets = Object.values(tickets).flat().length;
    const completedTickets = tickets.done.length;
    const percentage = totalTickets === 0 ? 0 : Math.round((completedTickets / totalTickets) * 100);
    
    setProgress({
      total: totalTickets,
      completed: completedTickets,
      percentage
    });
  }, [tickets]);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    if (source.droppableId === destination.droppableId) {
      const items = Array.from(tickets[source.droppableId]);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);

      setTickets({
        ...tickets,
        [source.droppableId]: items,
      });
    } else {
      const sourceItems = Array.from(tickets[source.droppableId]);
      const destItems = Array.from(tickets[destination.droppableId]);
      const [removedItem] = sourceItems.splice(source.index, 1);
      destItems.splice(destination.index, 0, removedItem);

      setTickets({
        ...tickets,
        [source.droppableId]: sourceItems,
        [destination.droppableId]: destItems,
      });
    }
  };

  const handleCreateTicket = () => {
    const newId = `ticket-${Date.now()}`;
    setTickets({
      ...tickets,
      todo: [
        ...tickets.todo,
        { id: newId, ...newTicket },
      ],
    });
    setShowTicketModal(false);
    setNewTicket({ title: '', description: '', date: new Date(), priority: 'LOW' });
  };

  const exportCalendar = () => {
    const allTickets = [
      ...tickets.todo,
      ...tickets.inProgress,
      ...tickets.done,
    ];

    const csvContent = [
      ['Title', 'Description', 'Status', 'Date'].join(','),
      ...allTickets.map(ticket => {
        const status = Object.keys(tickets).find(key => 
          tickets[key].some(t => t.id === ticket.id)
        );
        return [
          ticket.title,
          ticket.description,
          status,
          format(ticket.date, 'yyyy-MM-dd'),
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'calendar_export.csv';
    link.click();
  };

  const deleteTicket = (ticketId) => {
    const newTickets = {};
    Object.keys(tickets).forEach(column => {
      newTickets[column] = tickets[column].filter(ticket => ticket.id !== ticketId);
    });
    setTickets(newTickets);
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <div className="w-20 bg-[#e8f5e9] p-4 flex flex-col items-center">
        <Link href="/dashboard" className="mb-8">
          <div className="w-12 h-12 bg-[#f1faf2] rounded-full flex items-center justify-center shadow-sm hover:bg-[#d7ecd9] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        </Link>
        <div className="w-12 h-12 bg-[#d7ecd9] rounded-full flex items-center justify-center shadow-sm mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <Link href={`/project/${projectName}/bill-splitter`} className="mb-4">
          <div className="w-12 h-12 bg-[#f1faf2] rounded-full flex items-center justify-center shadow-sm hover:bg-[#d7ecd9] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </Link>

      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 bg-[#e8f5e9] -mx-8 -mt-8 px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/project/${projectName}`}>
              <div className="w-10 h-10 bg-[#f1faf2] rounded-full flex items-center justify-center hover:bg-[#d7ecd9] transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </Link>
            <h1 className="text-2xl font-semibold">Project Calendar</h1>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowTicketModal(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Create Task
            </button>
            <button
              onClick={exportCalendar}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              Export
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="max-w-6xl mx-auto mb-6">
          <div className="flex justify-end gap-4 mb-6">
            <button
              onClick={() => setView('kanban')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'kanban' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('calendar')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                view === 'calendar' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              Calendar
            </button>
          </div>

          {/* Progress Bar */}
          {view === 'kanban' && (
            <div className="bg-white rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700">Project Progress</h3>
                <span className="text-sm text-gray-600">
                  {progress.completed} of {progress.total} tasks completed ({progress.percentage}%)
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500 ease-in-out"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className="bg-[#f1faf2] rounded-lg p-6">
            {view === 'kanban' ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(tickets).map(([columnId, items]) => (
                    <div key={columnId} className="bg-white p-4 rounded-lg">
                      <h2 className="text-lg font-semibold mb-4 capitalize">{columnId}</h2>
                      <Droppable droppableId={columnId}>
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                          >
                            {items.map((ticket, index) => (
                              <Draggable
                                key={ticket.id}
                                draggableId={ticket.id}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="bg-[#f1faf2] p-4 rounded-lg shadow-sm relative"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <h3 className="font-medium">{ticket.title}</h3>
                                      <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[ticket.priority]}`}>
                                          {ticket.priority}
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            deleteTicket(ticket.id);
                                          }}
                                          className="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                          <X size={16} />
                                        </button>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-600">{ticket.description}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                      {format(ticket.date, 'MMM dd, yyyy')}
                                    </p>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </DragDropContext>
            ) : (
              <div className="bg-white p-4 rounded-lg">
                <Calendar
                  localizer={localizer}
                  events={Object.values(tickets).flat().map(ticket => ({
                    title: ticket.title,
                    start: ticket.date,
                    end: ticket.date,
                    allDay: true,
                  }))}
                  startAccessor="start"
                  endAccessor="end"
                  style={{ height: 'calc(100vh - 300px)' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Ticket Modal */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create New Task</h2>
              <button
                onClick={() => setShowTicketModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={format(newTicket.date, 'yyyy-MM-dd')}
                  onChange={(e) => setNewTicket({ ...newTicket, date: new Date(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTicket}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 