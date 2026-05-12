import { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Calendar as CalendarIcon, Bot, Send, Plus } from 'lucide-react';
import './index.css';

// --- Types ---
interface JobData { daysWorked: number; lastWorkedDate: string | null; currentMonth: number; }
interface StudyData { daysStudied: number; hoursStudied: number; lastStudiedDate: string | null; lastHoursAdded: number; currentMonth: number; }
interface CalendarEvent { id: string; title: string; type: string; date: string; }
interface ChatMessage { text: string; sender: 'user' | 'ai'; }

const TARGET_JOB_DAYS = 16;
const TARGET_STUDY_HOURS = 40;

function getDaysInCurrentMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

// --- Components ---

function JobTracker() {
  const [jobData, setJobData] = useState<JobData>(() => {
    const saved = localStorage.getItem('catalyst_jobData');
    if (saved) return JSON.parse(saved);
    return { daysWorked: 0, lastWorkedDate: null, currentMonth: new Date().getMonth() };
  });

  useEffect(() => {
    const currentMonth = new Date().getMonth();
    if (jobData.currentMonth !== currentMonth) {
      const resetData = { daysWorked: 0, lastWorkedDate: null, currentMonth };
      setJobData(resetData);
      localStorage.setItem('catalyst_jobData', JSON.stringify(resetData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('catalyst_jobData', JSON.stringify(jobData));
  }, [jobData]);

  const today = new Date().toISOString().split('T')[0];
  const isDoneToday = jobData.lastWorkedDate === today;
  const percentage = Math.min((jobData.daysWorked / TARGET_JOB_DAYS) * 100, 100);

  const toggleWork = () => {
    setJobData(prev => {
      if (prev.lastWorkedDate !== today) {
        return { ...prev, daysWorked: prev.daysWorked + 1, lastWorkedDate: today };
      } else {
        return { ...prev, daysWorked: Math.max(0, prev.daysWorked - 1), lastWorkedDate: null };
      }
    });
  };

  let petQuote = `"Ready to crush it today?"`;
  if (jobData.daysWorked === 0) petQuote = `"Let's get started on those 16 days!"`;
  else if (jobData.daysWorked >= TARGET_JOB_DAYS) petQuote = `"Goal reached! You're amazing. Go rest!"`;
  else if (isDoneToday) petQuote = `"Good job today. Be proud of yourself."`;

  return (
    <>
      <div className="pet-widget">
        <img src="/capybara_pet.png" alt="Digital Pet" id="digital-pet" onError={(e) => (e.currentTarget.style.display = 'none')} />
        <div className="pet-dialogue">{petQuote}</div>
      </div>
      <div className="job-tracker">
        <h2>Job Tracker</h2>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
          <div className="progress-text">{jobData.daysWorked} / {TARGET_JOB_DAYS} Days</div>
        </div>
        <button 
          className="work-btn" 
          onClick={(e) => {
             e.currentTarget.style.transform = 'scale(0.95)';
             setTimeout(() => (e.target as HTMLElement).style.transform = 'scale(1)', 150);
             toggleWork();
          }}
          style={{ opacity: isDoneToday ? 0.7 : 1 }}
        >
          {isDoneToday ? "Done for today!" : "I worked today."}
        </button>
      </div>
    </>
  );
}

function StudyTracker() {
  const [studyData, setStudyData] = useState<StudyData>(() => {
    const saved = localStorage.getItem('catalyst_studyData');
    if (saved) return JSON.parse(saved);
    return { daysStudied: 0, hoursStudied: 0, lastStudiedDate: null, lastHoursAdded: 0, currentMonth: new Date().getMonth() };
  });
  const [selectedHours, setSelectedHours] = useState(1);

  useEffect(() => {
    const currentMonth = new Date().getMonth();
    if (studyData.currentMonth !== currentMonth) {
      const resetData = { daysStudied: 0, hoursStudied: 0, lastStudiedDate: null, lastHoursAdded: 0, currentMonth };
      setStudyData(resetData);
      localStorage.setItem('catalyst_studyData', JSON.stringify(resetData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('catalyst_studyData', JSON.stringify(studyData));
  }, [studyData]);

  const today = new Date().toISOString().split('T')[0];
  const isDoneToday = studyData.lastStudiedDate === today;
  const daysInMonth = getDaysInCurrentMonth();
  const percentage = Math.min((studyData.daysStudied / daysInMonth) * 100, 100);

  const toggleStudy = () => {
    setStudyData(prev => {
      if (prev.lastStudiedDate !== today) {
        return { 
          ...prev, 
          daysStudied: prev.daysStudied + 1, 
          hoursStudied: prev.hoursStudied + selectedHours, 
          lastStudiedDate: today, 
          lastHoursAdded: selectedHours 
        };
      } else {
        return { 
          ...prev, 
          daysStudied: Math.max(0, prev.daysStudied - 1), 
          hoursStudied: Math.max(0, prev.hoursStudied - prev.lastHoursAdded), 
          lastStudiedDate: null 
        };
      }
    });
  };

  return (
    <div className="job-tracker" style={{ marginTop: '24px' }}>
      <h2>Study Tracker</h2>
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${percentage}%` }}></div>
        <div className="progress-text">{studyData.daysStudied} / {daysInMonth} Days | Total: {studyData.hoursStudied} Hrs</div>
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', alignItems: 'center' }}>
        <select 
          style={{ padding: '10px', border: '2px solid var(--border-color)', borderRadius: '6px', fontFamily: 'var(--font-main)', fontSize: '16px', background: 'transparent', cursor: 'pointer', opacity: isDoneToday ? 0.7 : 1 }}
          value={selectedHours} 
          onChange={e => setSelectedHours(Number(e.target.value))}
          disabled={isDoneToday}
        >
          {[1,2,3,4,5].map(h => <option key={h} value={h}>{h} Hour{h>1?'s':''}</option>)}
        </select>
        <button 
          className="work-btn" 
          onClick={(e) => {
             e.currentTarget.style.transform = 'scale(0.95)';
             setTimeout(() => (e.target as HTMLElement).style.transform = 'scale(1)', 150);
             toggleStudy();
          }}
          style={{ opacity: isDoneToday ? 0.7 : 1 }}
        >
          {isDoneToday ? "Done studying!" : "I studied today."}
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <section className="section active" style={{ display: 'block' }}>
      <div className="artwork-container">
        <img src="/artwork_placeholder.png" alt="Custom Artwork" onError={(e) => (e.currentTarget.style.display = 'none')} />
      </div>
      <JobTracker />
      <StudyTracker />
    </section>
  );
}

function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('catalyst_events');
    return saved ? JSON.parse(saved) : [];
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Class Test');
  const [newDate, setNewDate] = useState('');

  useEffect(() => {
    localStorage.setItem('catalyst_events', JSON.stringify(events));
  }, [events]);

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

  const renderMiniCalendar = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grids = [];
    for(let i=0; i<firstDay; i++) grids.push(<div key={`empty-${i}`}></div>);
    for(let i=1; i<=daysInMonth; i++) {
      const active = i === d.getDate() ? 'active' : '';
      grids.push(<div key={`day-${i}`} className={`mini-calendar-date ${active}`}>{i}</div>);
    }
    return grids;
  };

  return (
    <section className="section active" style={{ display: 'block' }}>
      <div className="calendar-header">
        <h2>No-Noise Calendar</h2>
        <button className="add-event-btn" onClick={() => setModalOpen(true)}>
          <Plus />
        </button>
      </div>

      <div className="mini-calendar">
        <div className="mini-calendar-header">
          {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
        </div>
        <div className="mini-calendar-grid">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d} className="mini-calendar-day">{d}</div>)}
          {renderMiniCalendar()}
        </div>
      </div>

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
        const data = JSON.parse(localStorage.getItem('catalyst_studyData') || '{}');
        setHistory(prev => [...prev, { text: `You've studied ${data.hoursStudied || 0} hours this month. The target is ${TARGET_STUDY_HOURS}. Keep it up!`, sender: 'ai' }]);
      } 
      else if (text.includes('how many days') || text.includes('worked') || text.includes('tracker')) {
        const data = JSON.parse(localStorage.getItem('catalyst_jobData') || '{}');
        setHistory(prev => [...prev, { text: `You've worked ${data.daysWorked || 0} days this month. The target is ${TARGET_JOB_DAYS}. You got this!`, sender: 'ai' }]);
      } 
      else if (text.includes('next test') || text.includes('exam')) {
        const evs = JSON.parse(localStorage.getItem('catalyst_events') || '[]') as CalendarEvent[];
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
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask Catalyst..." />
          <button onClick={handleSend}><Send size={20} /></button>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'ai'>('dashboard');

  return (
    <div className="app-container">
      <header>
        <h1>Catalyst</h1>
      </header>

      <main id="main-content">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'calendar' && <Calendar />}
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
