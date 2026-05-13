import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Bot, Send, Plus, Battery, BatteryCharging, Wifi, Signal, Edit2, Trash2, Save, X } from 'lucide-react';
import './index.css';

// --- Types ---
interface CalendarEvent { id: string; title: string; type: string; date: string; }
interface ChatMessage { text: string; sender: 'user' | 'ai'; }

const TARGET_JOB_DAYS = 16;
const TARGET_STUDY_HOURS = 40;

function getDaysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

// --- Components ---

function StatusBar() {
  const [time, setTime] = useState('');
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isCharging, setIsCharging] = useState(false);

  useEffect(() => {
    // Clock update
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);

    // Battery update (Warning: iOS Safari restricts this API, but works beautifully on other platforms)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100));
          setIsCharging(battery.charging);
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      });
    }

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="status-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '2px solid var(--border-color)', marginBottom: '10px' }}>
      <div className="status-time" style={{ fontSize: '14px', fontWeight: 'bold' }}>{time}</div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <img src="/rotten_to_the_core.jpg" alt="Logo" className="app-logo" style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid var(--border-color)', objectFit: 'cover' }} />
        <h1 style={{ fontFamily: 'var(--font-sketch)', fontSize: '20px', margin: 0 }}>AppleDHD</h1>
      </div>

      <div className="status-icons" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <Signal size={14} />
        <Wifi size={14} />
        <div className="battery-container" style={{ display: 'flex', alignItems: 'center' }}>
          {batteryLevel !== null && <span style={{ fontSize: '12px', marginRight: '2px' }}>{batteryLevel}%</span>}
          {isCharging ? <BatteryCharging size={16} /> : <Battery size={16} />}
        </div>
      </div>
    </div>
  );
}

interface TrackerConfig {
  id: string;
  name: string;
  type: 'days' | 'hours' | 'hours_only';
  targetDays?: number;
  targetHours?: number;
}

function GenericTracker({ config, onUpdate, onDelete }: { config: TrackerConfig, onUpdate: (c: TrackerConfig) => void, onDelete: () => void }) {
  const storageKey = `AppleDHD_tracker_${config.id}`;
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) return JSON.parse(saved);
    // Fallback migration for old data
    if (config.id === 'job' && localStorage.getItem('AppleDHD_jobData')) {
      const old = JSON.parse(localStorage.getItem('AppleDHD_jobData')!);
      return { daysCompleted: old.daysWorked || 0, hoursCompleted: 0, lastDate: old.lastWorkedDate, lastHoursAdded: 0, currentMonth: old.currentMonth };
    }
    if (config.id === 'study' && localStorage.getItem('AppleDHD_studyData')) {
      const old = JSON.parse(localStorage.getItem('AppleDHD_studyData')!);
      return { daysCompleted: old.daysStudied || 0, hoursCompleted: old.hoursStudied || 0, lastDate: old.lastStudiedDate, lastHoursAdded: old.lastHoursAdded || 0, currentMonth: old.currentMonth };
    }
    return { daysCompleted: 0, hoursCompleted: 0, lastDate: null, lastHoursAdded: 0, currentMonth: new Date().getMonth() };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(config.name);
  const [editTargetDays, setEditTargetDays] = useState(config.targetDays?.toString() || '');
  const [editTargetHours, setEditTargetHours] = useState(config.targetHours?.toString() || '');
  const [selectedHours, setSelectedHours] = useState(1);

  useEffect(() => {
    const currentMonth = new Date().getMonth();
    if (data.currentMonth !== currentMonth) {
      const resetData = { daysCompleted: 0, hoursCompleted: 0, lastDate: null, lastHoursAdded: 0, currentMonth };
      setData(resetData);
      localStorage.setItem(storageKey, JSON.stringify(resetData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [data]);

  const today = new Date().toISOString().split('T')[0];
  const isDoneToday = data.lastDate === today;
  let targetDays = config.targetDays || (config.type === 'days' ? TARGET_JOB_DAYS : getDaysInCurrentMonth());
  let targetHours = config.targetHours || TARGET_STUDY_HOURS;
  let percentage = 0;
  if (config.type === 'hours_only') {
    percentage = Math.min((data.hoursCompleted / targetHours) * 100, 100);
  } else {
    percentage = Math.min((data.daysCompleted / targetDays) * 100, 100);
  }

  const toggle = () => {
    setData((prev: any) => {
      if (prev.lastDate !== today) {
        return { 
          ...prev, 
          daysCompleted: prev.daysCompleted + 1, 
          hoursCompleted: prev.hoursCompleted + (config.type === 'hours' ? selectedHours : 0), 
          lastDate: today, 
          lastHoursAdded: config.type === 'hours' ? selectedHours : 0 
        };
      } else {
        return { 
          ...prev, 
          daysCompleted: Math.max(0, prev.daysCompleted - 1), 
          hoursCompleted: Math.max(0, prev.hoursCompleted - prev.lastHoursAdded), 
          lastDate: null 
        };
      }
    });
  };

  return (
    <div className="job-tracker" style={{ marginTop: '24px', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        {isEditing ? (
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <input 
                type="text" 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                style={{ fontSize: '18px', fontFamily: 'var(--font-sketch)', textAlign: 'center', border: '2px solid var(--border-color)', borderRadius: '4px', padding: '4px', flex: 1, background: 'transparent' }} 
                autoFocus
              />
              <button onClick={() => { onUpdate({ ...config, name: editName, targetDays: editTargetDays ? parseInt(editTargetDays) : undefined, targetHours: editTargetHours ? parseInt(editTargetHours) : undefined }); setIsEditing(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Save size={18} /></button>
              <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', gap: '5px' }}>
               {config.type !== 'hours_only' && (
                 <input 
                   type="number" 
                   placeholder="Target Days" 
                   value={editTargetDays} 
                   onChange={e => setEditTargetDays(e.target.value)} 
                   style={{ flex: 1, padding: '4px', border: '2px solid var(--border-color)', borderRadius: '4px', fontFamily: 'var(--font-main)', fontSize: '14px', background: 'transparent' }} 
                 />
               )}
               {(config.type === 'hours' || config.type === 'hours_only') && (
                 <input 
                   type="number" 
                   placeholder="Target Hrs" 
                   value={editTargetHours} 
                   onChange={e => setEditTargetHours(e.target.value)} 
                   style={{ flex: 1, padding: '4px', border: '2px solid var(--border-color)', borderRadius: '4px', fontFamily: 'var(--font-main)', fontSize: '14px', background: 'transparent' }} 
                 />
               )}
            </div>
          </div>
        ) : (
          <>
            <h2 style={{ margin: 0 }}>{config.name}</h2>
            <button onClick={() => setIsEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}><Edit2 size={16} /></button>
            {config.id !== 'job' && config.id !== 'study' && (
              <button onClick={() => { if (window.confirm('Delete this tracker?')) onDelete(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, color: 'red' }}><Trash2 size={16} /></button>
            )}
          </>
        )}
      </div>

      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
        <div className="progress-text">
          {config.type === 'hours_only' 
            ? `${data.hoursCompleted} / ${targetHours} Hrs`
            : `${data.daysCompleted} / ${targetDays} Days ${config.type === 'hours' ? `| Total: ${data.hoursCompleted}${config.targetHours ? ` / ${config.targetHours}` : ''} Hrs` : ''}`
          }
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
        {(config.type === 'hours' || config.type === 'hours_only') && (
          <input 
            type="number"
            min="0.5"
            step="0.5"
            placeholder="Hrs"
            style={{ padding: '10px', width: '80px', border: '2px solid var(--border-color)', borderRadius: '6px', fontFamily: 'var(--font-main)', fontSize: '16px', background: 'transparent', opacity: isDoneToday ? 0.7 : 1 }}
            value={selectedHours} 
            onChange={e => setSelectedHours(Number(e.target.value))}
            disabled={isDoneToday}
          />
        )}
        <button 
          className="work-btn" 
          onClick={(e) => {
             e.currentTarget.style.transform = 'scale(0.95)';
             setTimeout(() => (e.target as HTMLElement).style.transform = 'scale(1)', 150);
             toggle();
          }}
          style={{ opacity: isDoneToday ? 0.7 : 1 }}
        >
          {isDoneToday ? "Done for today!" : "I did this today."}
        </button>
      </div>
    </div>
  );
}

function MiniCalendar({ events, onDateClick }: { events: CalendarEvent[], onDateClick: (date: string) => void }) {
  const d = new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const grids = [];
  for(let i=0; i<firstDay; i++) grids.push(<div key={`empty-${i}`}></div>);
  
  for(let i=1; i<=daysInMonth; i++) {
    const currentDate = new Date(year, month, i);
    // Adjust for local timezone offset when generating ISO string
    const offset = currentDate.getTimezoneOffset() * 60000;
    const localDate = new Date(currentDate.getTime() - offset);
    const dateStr = localDate.toISOString().split('T')[0];
    
    const dayEvents = events.filter(e => e.date === dateStr);
    const hasEvent = dayEvents.length > 0;
    
    const isToday = i === d.getDate();
    const active = isToday ? 'active' : '';
    
    grids.push(
      <div 
        key={`day-${i}`} 
        className={`mini-calendar-date ${active}`} 
        style={{ position: 'relative', cursor: hasEvent ? 'pointer' : 'default', fontWeight: hasEvent ? 'bold' : 'normal', color: hasEvent && !isToday ? 'var(--text-color)' : '' }}
        onClick={() => hasEvent && onDateClick(dateStr)}
        title={hasEvent ? dayEvents.map(e => e.title).join(', ') : ''}
      >
        {i}
        {hasEvent && (
          <div style={{ position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', backgroundColor: isToday ? 'var(--bg-color)' : 'var(--text-color)', borderRadius: '50%' }}></div>
        )}
      </div>
    );
  }

  return (
    <div className="mini-calendar" style={{ marginBottom: '20px' }}>
      <div className="mini-calendar-header">
        {d.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </div>
      <div className="mini-calendar-grid">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="mini-calendar-day">{d}</div>)}
        {grids}
      </div>
    </div>
  );
}

function Dashboard({ events, onDateClick }: { events: CalendarEvent[], onDateClick: (date: string) => void }) {
  const [trackers, setTrackers] = useState<TrackerConfig[]>(() => {
    const saved = localStorage.getItem('AppleDHD_trackersConfig');
    if (saved) return JSON.parse(saved);
    return [
      { id: 'job', name: 'Job Tracker', type: 'days' },
      { id: 'study', name: 'Study Tracker', type: 'hours' }
    ];
  });
  
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'days'|'hours'|'hours_only'>('days');
  const [newTargetDays, setNewTargetDays] = useState('');
  const [newTargetHours, setNewTargetHours] = useState('');

  useEffect(() => {
    localStorage.setItem('AppleDHD_trackersConfig', JSON.stringify(trackers));
  }, [trackers]);

  const addTracker = () => {
    if (newName.trim()) {
      setTrackers([...trackers, { 
        id: Date.now().toString(), 
        name: newName.trim(), 
        type: newType,
        targetDays: newTargetDays ? parseInt(newTargetDays) : undefined,
        targetHours: newTargetHours ? parseInt(newTargetHours) : undefined
      }]);
      setIsAdding(false);
      setNewName('');
      setNewType('days');
      setNewTargetDays('');
      setNewTargetHours('');
    }
  };

  const updateTracker = (updated: TrackerConfig) => {
    setTrackers(trackers.map(t => t.id === updated.id ? updated : t));
  };

  const deleteTracker = (id: string) => {
    setTrackers(trackers.filter(t => t.id !== id));
  };

  return (
    <section className="section active" style={{ display: 'block' }}>
      <MiniCalendar events={events} onDateClick={onDateClick} />
      {trackers.map(t => (
        <GenericTracker key={t.id} config={t} onUpdate={updateTracker} onDelete={() => deleteTracker(t.id)} />
      ))}
      <div style={{ textAlign: 'center', marginTop: '30px' }}>
        {isAdding ? (
          <div style={{ background: 'var(--bg-color)', padding: '15px', borderRadius: '12px', border: '2px solid var(--border-color)', margin: '0 auto', maxWidth: '300px' }}>
             <h3 style={{ marginTop: 0, marginBottom: '15px', fontFamily: 'var(--font-sketch)', color: 'var(--accent-color)' }}>New Tracker</h3>
             <input 
               type="text" 
               placeholder="Tracker Name (e.g. Gym)" 
               value={newName} 
               onChange={e => setNewName(e.target.value)}
               style={{ width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '6px', border: '2px solid var(--border-color)', fontFamily: 'var(--font-main)', boxSizing: 'border-box', background: 'transparent' }}
               autoFocus
             />
             <select 
               value={newType} 
               onChange={e => setNewType(e.target.value as 'days'|'hours'|'hours_only')}
               style={{ width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '6px', border: '2px solid var(--border-color)', fontFamily: 'var(--font-main)', boxSizing: 'border-box', cursor: 'pointer', background: 'transparent' }}
             >
               <option value="days">Track Days Only</option>
               <option value="hours_only">Track Hours Only</option>
               <option value="hours">Track Days & Hours</option>
             </select>
             {newType !== 'hours_only' && (
               <input 
                 type="number" 
                 placeholder="Target Days (Optional)" 
                 value={newTargetDays} 
                 onChange={e => setNewTargetDays(e.target.value)}
                 style={{ width: '100%', marginBottom: '10px', padding: '10px', borderRadius: '6px', border: '2px solid var(--border-color)', fontFamily: 'var(--font-main)', boxSizing: 'border-box', background: 'transparent' }}
               />
             )}
             {(newType === 'hours' || newType === 'hours_only') && (
               <input 
                 type="number" 
                 placeholder="Target Hours (Optional)" 
                 value={newTargetHours} 
                 onChange={e => setNewTargetHours(e.target.value)}
                 style={{ width: '100%', marginBottom: '15px', padding: '10px', borderRadius: '6px', border: '2px solid var(--border-color)', fontFamily: 'var(--font-main)', boxSizing: 'border-box', background: 'transparent' }}
               />
             )}
             <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
               <button className="btn-secondary" onClick={() => setIsAdding(false)}>Cancel</button>
               <button className="work-btn" style={{ padding: '8px 16px', fontSize: '14px' }} onClick={addTracker}>Add</button>
             </div>
          </div>
        ) : (
          <button className="btn-secondary" onClick={() => setIsAdding(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Plus size={16} /> Add New Tracker
          </button>
        )}
      </div>
    </section>
  );
}

function Calendar({ events, setEvents, onDateClick }: { events: CalendarEvent[], setEvents: (events: CalendarEvent[]) => void, onDateClick: (date: string) => void }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Class Test');
  const [newDate, setNewDate] = useState('');

  const saveEvent = () => {
    if (!newTitle || !newDate) { alert("Please fill out what and when."); return; }
    setEvents([...events, { id: Date.now().toString(), title: newTitle, type: newType, date: newDate }]);
    setModalOpen(false);
    setNewTitle(''); setNewDate('');
  };

  const today = new Date();
  today.setHours(0,0,0,0);

  const upcomingEvents = [...events]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter(e => new Date(e.date) >= today);

  return (
    <section className="section active" style={{ display: 'block' }}>
      <div className="calendar-header">
        <h2>No-Noise Calendar</h2>
        <button className="add-event-btn" onClick={() => setModalOpen(true)}>
          <Plus />
        </button>
      </div>

      <MiniCalendar events={events} onDateClick={onDateClick} />

      <div className="event-list">
        {upcomingEvents.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--accent-color)', fontFamily: 'var(--font-sketch)' }}>No upcoming events. Peace and quiet.</p>
        ) : (
          upcomingEvents.map(e => {
            const timeDiff = new Date(e.date).getTime() - today.getTime();
            const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
            const isUrgent = daysLeft <= 3;
            let text = daysLeft === 0 ? 'Today!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days left`;
            return (
              <div key={e.id} className="event-card" onDoubleClick={() => {
                if(window.confirm('Delete this event?')) setEvents(events.filter(ev => ev.id !== e.id));
              }}>
                <div className="event-title">{e.title}</div>
                <div className="event-type">{e.type}</div>
                <div className={`event-countdown ${isUrgent ? 'urgent' : ''}`}>{text}</div>
              </div>
            );
          })
        )}
      </div>

      {modalOpen && (
        <div className="modal active">
          <div className="modal-content">
            <h3>New Event</h3>
            <div className="form-group">
              <label>What is it?</label>
              <input type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Algorithms Midterm" />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="Class Test">Class Test</option>
                <option value="Project Deadline">Project Deadline</option>
                <option value="Note">Note</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
            </div>
            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="work-btn" onClick={saveEvent} style={{ fontSize: '16px', padding: '8px 16px' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function AiAssistant() {
  const [history, setHistory] = useState<ChatMessage[]>([{ text: "Hey. I'm your lazy mode assistant. Ask me about your tasks or how many days you've worked.", sender: 'ai' }]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const processQuery = (q: string) => {
    const text = q.toLowerCase();
    setTimeout(() => {
      if (text.includes('how many hours') || text.includes('studied') || text.includes('study')) {
        const data = JSON.parse(localStorage.getItem('AppleDHD_studyData') || '{}');
        setHistory(prev => [...prev, { text: `You've studied ${data.hoursStudied || 0} hours this month. The target is ${TARGET_STUDY_HOURS}. Keep it up!`, sender: 'ai' }]);
      } 
      else if (text.includes('how many days') || text.includes('worked') || text.includes('tracker')) {
        const data = JSON.parse(localStorage.getItem('AppleDHD_jobData') || '{}');
        setHistory(prev => [...prev, { text: `You've worked ${data.daysWorked || 0} days this month. The target is ${TARGET_JOB_DAYS}. You got this!`, sender: 'ai' }]);
      } 
      else if (text.includes('next test') || text.includes('exam')) {
        const evs = JSON.parse(localStorage.getItem('AppleDHD_events') || '[]') as CalendarEvent[];
        const today = new Date(); today.setHours(0,0,0,0);
        const tests = evs.filter(e => e.type === 'Class Test' && new Date(e.date) >= today).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        if (tests.length > 0) {
          const daysLeft = Math.ceil((new Date(tests[0].date).getTime() - today.getTime()) / (1000 * 3600 * 24));
          setHistory(prev => [...prev, { text: `Your next test is "${tests[0].title}" in ${daysLeft} days (${tests[0].date}).`, sender: 'ai' }]);
        } else {
          setHistory(prev => [...prev, { text: `No upcoming tests found. Phew!`, sender: 'ai' }]);
        }
      } 
      else {
        setHistory(prev => [...prev, { text: `I'm a minimalist AI. I can tell you about your work days, study hours, or schedule ("when is my next test?").`, sender: 'ai' }]);
      }
    }, 600);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    setHistory(prev => [...prev, { text: input, sender: 'user' }]);
    processQuery(input);
    setInput('');
  };

  return (
    <section className="section active" style={{ display: 'block', height: '100%' }}>
      <div className="chat-container">
        <div className="chat-history">
          {history.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.sender}`}>{msg.text}</div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div className="chat-input-area">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask AppleDHD..." />
          <button onClick={handleSend}><Send size={20} /></button>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'ai'>('dashboard');
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('AppleDHD_events');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('AppleDHD_events', JSON.stringify(events));
  }, [events]);

  return (
    <div className="app-container">
      <StatusBar />

      <main id="main-content">
        {activeTab === 'dashboard' && <Dashboard events={events} onDateClick={() => setActiveTab('calendar')} />}
        {activeTab === 'calendar' && <Calendar events={events} setEvents={setEvents} onDateClick={() => setActiveTab('calendar')} />}
        {activeTab === 'ai' && <AiAssistant />}
      </main>

      <nav>
        <button className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
          <LayoutDashboard size={24} style={{ transform: 'rotate(-2deg)' }} />
          <span>Home</span>
        </button>
        <button className={`nav-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>
          <CalendarIcon size={24} style={{ transform: 'rotate(-2deg)' }} />
          <span>Events</span>
        </button>
        <button className={`nav-btn ${activeTab === 'ai' ? 'active' : ''}`} onClick={() => setActiveTab('ai')}>
          <Bot size={24} style={{ transform: 'rotate(-2deg)' }} />
          <span>Ask AI</span>
        </button>
      </nav>
    </div>
  );
}
