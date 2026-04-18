"use client";

import { useRef, useCallback, useState } from "react";
import {
    format, isToday, parseISO, addMonths, subMonths,
    startOfMonth, endOfMonth, eachDayOfInterval, getDay,
    startOfWeek, endOfWeek, addDays,
} from "date-fns";
import { nl } from "date-fns/locale";
import {
    CheckCircle, XCircle, ChevronLeft, ChevronRight,
    Mail, Phone, MessageSquare, CalendarDays, Inbox,
    Plus, X, Loader2, CalendarPlus, Pencil, Ban, Unlock, GripVertical, LayoutGrid,
} from "lucide-react";
import { addWeeks, subWeeks } from "date-fns";
import { generateDaySlots, APPOINTMENT_CONFIG } from "@/lib/appointmentConfig";
import {
    useAppointmentsReducer,
    type Appointment,
    type AptForm,
    type BlockedDateEntry,
} from "@/hooks/useAppointmentsReducer";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
    pending: "Wacht op bevestiging",
    confirmed: "Bevestigd",
    cancelled: "Geannuleerd",
};
const CALENDAR_BORDER: Record<string, string> = {
    pending: "border-l-amber-400", confirmed: "border-l-green-500", cancelled: "border-l-slate-300",
};
const CALENDAR_BG: Record<string, string> = {
    pending: "bg-amber-50 hover:bg-amber-100", confirmed: "bg-green-50 hover:bg-green-100", cancelled: "bg-slate-50",
};
const STATUS_DOT: Record<string, string> = {
    pending: "bg-amber-400 animate-pulse", confirmed: "bg-green-500", cancelled: "bg-slate-300",
};
const ALL_SLOTS = generateDaySlots();
const ROW_H = 68; // px — must match the min-h-[68px] on slot rows

function mondayIndex(d: Date) { const n = getDay(d); return n === 0 ? 6 : n - 1; }

/** Returns end time string for a slot + duration, e.g. ("09:00", 3) => "12:00" */
function slotEndTime(startSlot: string, duration: number): string {
    const [h, m] = startSlot.split(":").map(Number);
    const total = h * 60 + m + duration * 60;
    return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

// ─── DragHandle ───────────────────────────────────────────────────────────────

function DragHandle({ apt, maxExtra, onResize }: {
    apt: Appointment;
    maxExtra: number;
    onResize: (id: string, duration: number) => void;
}) {
    const startY = useRef<number>(0);
    const startDur = useRef<number>(apt.durationHours ?? 1);
    const liveDur = useRef<number>(apt.durationHours ?? 1);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        startY.current = e.clientY;
        startDur.current = apt.durationHours ?? 1;
        liveDur.current = startDur.current;

        const onMove = (ev: MouseEvent) => {
            const delta = ev.clientY - startY.current;
            const slotsDelta = Math.round(delta / ROW_H);
            const newDur = Math.max(1, Math.min(startDur.current + slotsDelta, startDur.current + maxExtra));
            if (newDur !== liveDur.current) {
                liveDur.current = newDur;
                // Visual preview via CSS custom property
                const el = document.getElementById(`apt-card-${apt.id}`);
                if (el) el.style.height = `${newDur * ROW_H - 4}px`;
            }
        };

        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            if (liveDur.current !== (apt.durationHours ?? 1)) {
                onResize(apt.id, liveDur.current);
            }
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, [apt.id, apt.durationHours, maxExtra, onResize]);

    return (
        <div
            onMouseDown={handleMouseDown}
            className="absolute bottom-0 left-0 right-0 h-4 flex items-center justify-center cursor-ns-resize opacity-0 group-hover/card:opacity-100 transition-opacity rounded-b-lg bg-gradient-to-t from-black/10 to-transparent hover:from-black/20"
            title={`Sleep om duur aan te passen (nu: ${apt.durationHours ?? 1}u)`}
        >
            <GripVertical size={12} className="text-slate-500 rotate-90" />
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AppointmentsClient({
    appointments: init, blocks: initBlocks,
}: { appointments: Appointment[]; blocks: BlockedDateEntry[] }) {
    const {
        state,
        dispatch,
        isPending,
        createSub,
        editSub,
        blockSub,
        confirmSub,
        derived: {
            today, weekStart, weekEnd, weekDays,
            pendingApts, calData, blockedDays, blockedSlots,
            weekTotal, availCreate, availEdit,
            isSlotBlocked, getBlockId,
        },
        handlers: {
            openConfirm, handleConfirmSubmit, handleCancel,
            openCreate, openEdit, openBlock,
            handleCreateSubmit, handleEditSubmit, handleBlockSubmit,
            handleUnblock, handleResizeDrag,
        },
    } = useAppointmentsReducer(init, initBlocks);

    const [monthOverlay, setMonthOverlay] = useState(false);
    const [overlayView, setOverlayView] = useState<"month"|"week"|"day">("month");
    const [overlayMonth, setOverlayMonth] = useState(() => new Date());
    const [overlayWeekAnchor, setOverlayWeekAnchor] = useState(() => new Date());
    const [overlayDay, setOverlayDay] = useState(() => new Date());

    const {
        appointments, blocks, popoverId, slotPopover,
        createOpen, createForm, createErrors, createError, createMonth,
        editOpen, editForm, editErrors, editError, editMonth,
        blockOpen, blockForm, blockError, blockMonth,
        confirmModalId, confirmDuration,
    } = state;

    // ── Render ────────────────────────────────────────────────────────────────
    const confirmedCount = appointments.filter(a => a.status === "confirmed").length;
    const totalCount = appointments.length;

    return (
    <div className="space-y-6">

      {/* ── Stats bar ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className={`rounded-2xl px-5 py-4 flex items-center gap-4 border ${pendingApts.length > 0 ? "bg-amber-50 border-amber-200" : "bg-white border-slate-200"}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pendingApts.length > 0 ? "bg-amber-100" : "bg-slate-100"}`}>
            <Inbox size={18} className={pendingApts.length > 0 ? "text-amber-600" : "text-slate-400"} />
          </div>
          <div>
            <p className={`text-2xl font-black leading-none ${pendingApts.length > 0 ? "text-amber-700" : "text-slate-300"}`}>{pendingApts.length}</p>
            <p className={`text-xs font-bold mt-0.5 ${pendingApts.length > 0 ? "text-amber-600" : "text-slate-400"}`}>Te bevestigen</p>
          </div>
          {pendingApts.length > 0 && <span className="ml-auto w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />}
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircle size={18} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-slate-800">{confirmedCount}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Bevestigd</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <CalendarDays size={18} className="text-slate-600" />
          </div>
          <div>
            <p className="text-2xl font-black leading-none text-slate-800">{totalCount}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Totaal afspraken</p>
          </div>
        </div>
      </div>

      {/* ── Main 2-col layout ─────────────────────────────────────────────────── */}
      <div className="flex gap-6 items-start">

        {/* ── LEFT: Calendar (always visible) ──────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-4">
            <div>
              <h2 className="font-black text-slate-900 text-base leading-tight">Weekoverzicht</h2>
              <p className="text-xs text-slate-400 font-medium">
                {format(weekStart,"d MMM",{locale:nl})} {"\u2013"} {format(weekEnd,"d MMM yyyy",{locale:nl})}
                {weekTotal > 0 && <span className="ml-2">· {weekTotal} {weekTotal===1?"afspraak":"afspraken"}</span>}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={()=>setMonthOverlay(true)} className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-slate-400 transition-colors"><LayoutGrid size={13}/>Maandoverzicht</button>
              <button onClick={()=>openBlock()} className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"><Ban size={13}/>Dag blokkeren</button>
              <button onClick={()=>openCreate()} className="flex items-center gap-1.5 px-3 py-2 bg-[#d91c1c] text-white rounded-xl text-xs font-bold hover:bg-[#b91515] transition-colors shadow-sm"><Plus size={14}/>Nieuwe afspraak</button>
              <button onClick={()=>dispatch({type:"SET_WEEK_ANCHOR",anchor:subWeeks(state.weekAnchor,1)})} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-slate-400 transition-colors"><ChevronLeft size={15}/></button>
              <button onClick={()=>dispatch({type:"SET_WEEK_ANCHOR",anchor:new Date()})} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-slate-400 transition-colors">Vandaag</button>
              <button onClick={()=>dispatch({type:"SET_WEEK_ANCHOR",anchor:addWeeks(state.weekAnchor,1)})} className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:border-slate-400 transition-colors"><ChevronRight size={15}/></button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="grid grid-cols-[56px_repeat(5,1fr)] border-b border-slate-200 bg-slate-50">
              <div className="py-3 border-r border-slate-200"/>
              {weekDays.map(day=>{
                const tod=isToday(day);
                const ds=format(day,"yyyy-MM-dd");
                const dayBlocked=blockedDays.has(ds);
                return(
                  <div key={day.toISOString()} className={`py-3 px-2 text-center border-r border-slate-200 last:border-r-0 relative ${tod?"bg-[#d91c1c]/5":dayBlocked?"bg-slate-100":""}`}>
                    {dayBlocked&&<span className="absolute top-1 right-1 text-slate-400" title="Dag geblokkeerd"><Ban size={10}/></span>}
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${tod?"text-[#d91c1c]":"text-slate-400"}`}>{format(day,"EEE",{locale:nl})}</p>
                    <div className={`mx-auto mt-0.5 w-8 h-8 flex items-center justify-center rounded-full ${tod?"bg-[#d91c1c]":""}`}>
                      <p className={`text-base font-black leading-none ${tod?"text-white":dayBlocked?"text-slate-400":"text-slate-800"}`}>{format(day,"d")}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-[56px_repeat(5,1fr)]">
              <div className="border-r border-slate-100">
                {ALL_SLOTS.map(slot=>(
                  <div key={slot} style={{height:ROW_H}} className="border-b border-slate-100 flex items-start justify-end px-2 pt-2.5 last:border-b-0">
                    <span className="text-[11px] font-bold text-slate-400">{slot}</span>
                  </div>
                ))}
              </div>
              {weekDays.map(day=>{
                const ds=format(day,"yyyy-MM-dd");
                const tod=isToday(day);
                const dayBlocked=blockedDays.has(ds);
                const renderedSlots = new Set<string>();
                return(
                  <div key={ds} className="relative border-r border-slate-100 last:border-r-0">
                    {ALL_SLOTS.map((slot)=>{
                      const apts=calData[ds]?.[slot]??[];
                      const coveredBySpan = renderedSlots.has(slot);
                      apts.forEach(apt=>{
                        if((apt.durationHours??1)>1){
                          const idx=ALL_SLOTS.indexOf(apt.timeSlot);
                          for(let i=1;i<(apt.durationHours??1);i++){
                            if(ALL_SLOTS[idx+i]) renderedSlots.add(ALL_SLOTS[idx+i]);
                          }
                        }
                      });
                      // Slots visually covered by a spanning card — render transparent spacer (wins over blocked)
                      if(coveredBySpan) return <div key={slot} style={{height:ROW_H}}/>;
                      const slotBlockedFlag=!dayBlocked&&(blockedSlots[ds]?.has(slot)??false);
                      const blocked=dayBlocked||slotBlockedFlag;
                      const blockId=blocked?getBlockId(ds,dayBlocked?null:slot):null;
                      const hasSpan = apts.some(a=>(a.durationHours??1)>1);
                      return(
                        <div key={slot} style={{height:ROW_H}} className={`${hasSpan?"":"border-b border-slate-100"} last:border-b-0 relative group ${tod&&!blocked&&apts.length===0?"bg-[#d91c1c]/[0.015]":""}`}>
                          {blocked&&(
                            <div className="absolute inset-0 bg-slate-100 flex items-center justify-center z-10"
                              style={{backgroundImage:"repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.04) 4px,rgba(0,0,0,0.04) 8px)"}}>
                              <button onClick={()=>blockId&&handleUnblock(blockId)} disabled={isPending} title="Klik om blokkering te verwijderen"
                                className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-[10px] font-bold text-slate-600 hover:border-red-400 hover:text-red-600 transition-all shadow-sm z-20 relative">
                                <Unlock size={10}/>{dayBlocked?"Dag":"Slot"}
                              </button>
                            </div>
                          )}
                          {!blocked&&!coveredBySpan&&apts.length===0&&(
                            <div className="absolute inset-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                              <button onClick={()=>openCreate(ds,slot)} title="Afspraak toevoegen"
                                className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-200 hover:border-[#d91c1c] hover:bg-[#d91c1c]/5 text-slate-300 hover:text-[#d91c1c] transition-all">
                                <Plus size={14}/>
                              </button>
                              <button onClick={()=>{dispatch({type:"SET_SLOT_POPOVER",popover:{dateStr:ds,slot}});}} title="Tijdslot blokkeren"
                                className="flex items-center justify-center w-8 rounded-lg border-2 border-dashed border-slate-200 hover:border-slate-500 hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-all">
                                <Ban size={12}/>
                              </button>
                              {slotPopover?.dateStr===ds&&slotPopover?.slot===slot&&(
                                <div className="absolute left-0 bottom-full mb-1 z-30 bg-white rounded-xl shadow-xl border border-slate-200 p-3 w-48">
                                  <div className="fixed inset-0 z-[-1]" onClick={()=>dispatch({type:"SET_SLOT_POPOVER",popover:null})}/>
                                  <p className="text-[11px] font-black text-slate-700 mb-2">Tijdslot blokkeren<br/><span className="font-medium text-slate-400">{format(parseISO(ds),"d MMM",{locale:nl})} · {slot}</span></p>
                                  <button onClick={()=>openBlock(ds,slot)} className="w-full py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors">Blokkeer dit slot</button>
                                </div>
                              )}
                            </div>
                          )}
                          {!blocked&&apts.map(apt=>{
                            const dur=apt.durationHours??1;
                            const cardH=dur*ROW_H-4;
                            const startIdx=ALL_SLOTS.indexOf(apt.timeSlot);
                            const maxExtra=ALL_SLOTS.length-startIdx-dur;
                            return(
                              <div key={apt.id} className="relative">
                                <div id={`apt-card-${apt.id}`} style={{height:cardH,zIndex:20}}
                                  className={`absolute top-0.5 left-1 right-1 rounded-lg border-l-4 group/card shadow-sm ${CALENDAR_BORDER[apt.status]} ${apt.status==="pending"?"bg-amber-50":apt.status==="confirmed"?"bg-green-50":"bg-slate-50"}`}>
                                  <button onClick={()=>dispatch({type:"SET_POPOVER",id:popoverId===apt.id?null:apt.id})} className="absolute inset-0 text-left px-2 pt-1.5 pb-5">
                                    <p className="font-black text-slate-900 truncate leading-tight text-xs">{apt.name}</p>
                                    <p className="text-slate-500 truncate text-[10px] mt-0.5 leading-tight">{apt.service}</p>
                                    {dur>1&&<p className="text-[10px] font-bold text-slate-400 mt-1">{dur}u · {apt.timeSlot}</p>}
                                  </button>
                                  <DragHandle apt={apt} maxExtra={maxExtra} onResize={handleResizeDrag}/>
                                </div>
                                {popoverId===apt.id&&<CalendarPopover apt={apt} onClose={()=>dispatch({type:"SET_POPOVER",id:null})} onEdit={()=>openEdit(apt)} onConfirm={openConfirm} onCancel={handleCancel} isPending={isPending}/>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-5 mt-3 px-1 flex-wrap">
            {(["pending","confirmed"] as const).map(s=>(
              <div key={s} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2 rounded-sm border-l-4 ${CALENDAR_BORDER[s]} ${CALENDAR_BG[s]}`}/>
                <span className="text-xs text-slate-400 font-medium">{STATUS_LABELS[s]}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2 rounded-sm bg-slate-200"/>
              <span className="text-xs text-slate-400 font-medium">Geblokkeerd</span>
            </div>
            <span className="text-xs text-slate-400 font-medium ml-auto italic">Sleep onderkant kaart om duur aan te passen</span>
          </div>
        </div>

        {/* ── RIGHT: Pending sidebar ────────────────────────────────────────── */}
        <div className="w-80 shrink-0 sticky top-6">
          <div className={`rounded-2xl px-4 py-3 mb-3 flex items-center gap-3 ${pendingApts.length > 0 ? "bg-amber-500" : "bg-slate-200"}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${pendingApts.length > 0 ? "bg-white/20" : "bg-white/60"}`}>
              <Inbox size={16} className={pendingApts.length > 0 ? "text-white" : "text-slate-500"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-black uppercase tracking-wider ${pendingApts.length > 0 ? "text-amber-100" : "text-slate-400"}`}>Wacht op actie</p>
              <p className={`text-sm font-black leading-tight ${pendingApts.length > 0 ? "text-white" : "text-slate-400"}`}>
                {pendingApts.length === 0 ? "Alles behandeld" : `${pendingApts.length} ${pendingApts.length === 1 ? "aanvraag" : "aanvragen"}`}
              </p>
            </div>
            {pendingApts.length > 0 && <span className="w-3 h-3 rounded-full bg-white/40 animate-pulse shrink-0" />}
          </div>

          {pendingApts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl px-5 py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={22} className="text-green-400" />
              </div>
              <p className="font-black text-slate-700 text-sm">Niets te doen</p>
              <p className="text-xs text-slate-400 mt-1">Alle aanvragen zijn behandeld</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[calc(100vh-260px)] overflow-y-auto pr-0.5">
              {pendingApts.map((apt) => (
                <div key={apt.id} className="bg-white border border-amber-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow hover:border-amber-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="shrink-0 bg-amber-50 border border-amber-200 rounded-xl w-12 h-14 flex flex-col items-center justify-center">
                      <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">{format(apt.date,"EEE",{locale:nl})}</p>
                      <p className="text-lg font-black text-slate-900 leading-none">{format(apt.date,"d",{locale:nl})}</p>
                      <p className="text-[9px] font-bold text-slate-400 mt-0.5">{format(apt.date,"MMM",{locale:nl})}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-900 text-sm leading-tight truncate">{apt.name}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{apt.service}</p>
                      <span className="inline-block text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full mt-1.5">{apt.timeSlot}</span>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3 pb-3 border-b border-slate-100">
                    <a href={`mailto:${apt.email}`} className="flex items-center gap-2 text-xs text-[#d91c1c] font-medium hover:underline truncate"><Mail size={11} className="shrink-0"/>{apt.email}</a>
                    <a href={`tel:${apt.phone}`} className="flex items-center gap-2 text-xs text-slate-500 font-medium hover:underline"><Phone size={11} className="shrink-0"/>{apt.phone}</a>
                    {apt.notes && <p className="flex items-start gap-2 text-xs text-slate-400"><MessageSquare size={11} className="shrink-0 mt-0.5"/><span className="line-clamp-2">{apt.notes}</span></p>}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button onClick={()=>openEdit(apt)} className="flex items-center justify-center gap-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-[11px] font-bold hover:bg-slate-200 transition-colors"><Pencil size={11}/>Bewerken</button>
                    <button onClick={()=>openConfirm(apt.id)} disabled={isPending} className="flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded-xl text-[11px] font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"><CheckCircle size={12}/>OK</button>
                    <button onClick={()=>handleCancel(apt.id)} disabled={isPending} className="flex items-center justify-center gap-1 py-2 bg-white text-red-500 border border-red-200 rounded-xl text-[11px] font-bold hover:bg-red-50 disabled:opacity-50 transition-colors"><XCircle size={12}/>Weiger</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* ── CALENDAR OVERVIEW overlay ─────────────────────────────────────────── */}
      {monthOverlay&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{backgroundColor:"rgba(10,10,16,0.80)",backdropFilter:"blur(10px)"}} onClick={e=>e.target===e.currentTarget&&setMonthOverlay(false)}>
        <div className="bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden" style={{width:"min(1400px,calc(100vw - 48px))",height:"calc(100vh - 48px)"}}>
          {/* Header bar */}
          <div className="flex items-center justify-between px-7 py-4 border-b border-slate-200 shrink-0">
            {/* Left: icon + title + legend */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><LayoutGrid size={17} className="text-slate-700"/></div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Overzicht</p>
                <h2 className="text-lg font-black text-slate-900 capitalize leading-tight truncate">
                  {overlayView==="month"&&format(overlayMonth,"MMMM yyyy",{locale:nl})}
                  {overlayView==="week"&&`${format(startOfWeek(overlayWeekAnchor,{weekStartsOn:1}),"d MMM",{locale:nl})} – ${format(endOfWeek(overlayWeekAnchor,{weekStartsOn:1}),"d MMM yyyy",{locale:nl})}`}
                  {overlayView==="day"&&format(overlayDay,"EEEE d MMMM yyyy",{locale:nl})}
                </h2>
              </div>
              {/* Legend */}
              <div className="ml-4 hidden xl:flex items-center gap-4 pl-4 border-l border-slate-200">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400"/><span className="text-xs text-slate-500 font-medium">Te bevestigen</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"/><span className="text-xs text-slate-500 font-medium">Bevestigd</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-slate-200"/><span className="text-xs text-slate-500 font-medium">Geblokkeerd</span></div>
              </div>
            </div>
            {/* Center: view switcher */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-0.5 shrink-0">
              {(["day","week","month"] as const).map(v=>(
                <button key={v} onClick={()=>setOverlayView(v)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${overlayView===v?"bg-white text-slate-900 shadow-sm":"text-slate-500 hover:text-slate-700"}`}>
                  {v==="day"?"Dag":v==="week"?"Week":"Maand"}
                </button>
              ))}
            </div>
            {/* Right: navigation + close */}
            <div className="flex items-center gap-2 shrink-0">
              {overlayView==="month"&&<>
                <button onClick={()=>setOverlayMonth(m=>subMonths(m,1))} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"><ChevronLeft size={15}/></button>
                <button onClick={()=>setOverlayMonth(new Date())} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">Vandaag</button>
                <button onClick={()=>setOverlayMonth(m=>addMonths(m,1))} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"><ChevronRight size={15}/></button>
              </>}
              {overlayView==="week"&&<>
                <button onClick={()=>setOverlayWeekAnchor(d=>addDays(d,-7))} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"><ChevronLeft size={15}/></button>
                <button onClick={()=>setOverlayWeekAnchor(new Date())} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">Vandaag</button>
                <button onClick={()=>setOverlayWeekAnchor(d=>addDays(d,7))} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"><ChevronRight size={15}/></button>
              </>}
              {overlayView==="day"&&<>
                <button onClick={()=>setOverlayDay(d=>addDays(d,-1))} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"><ChevronLeft size={15}/></button>
                <button onClick={()=>setOverlayDay(new Date())} className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">Vandaag</button>
                <button onClick={()=>setOverlayDay(d=>addDays(d,1))} className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors"><ChevronRight size={15}/></button>
              </>}
              <button onClick={()=>setMonthOverlay(false)} className="ml-2 w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition-colors bg-slate-50 border border-slate-200"><X size={17}/></button>
            </div>
          </div>

          {/* ── MONTH VIEW ────────────────────────────────────────────────────── */}
          {overlayView==="month"&&(
            <>
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 shrink-0">
                {["Maandag","Dinsdag","Woensdag","Donderdag","Vrijdag","Zaterdag","Zondag"].map(d=>(
                  <div key={d} className="py-2.5 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-200 last:border-r-0">{d}</div>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto">
                {(()=>{
                  const days=eachDayOfInterval({start:startOfMonth(overlayMonth),end:endOfMonth(overlayMonth)});
                  const lead=mondayIndex(startOfMonth(overlayMonth));
                  const cells:(Date|null)[]=[...Array(lead).fill(null),...days];
                  while(cells.length%7!==0) cells.push(null);
                  const rows:(Date|null)[][]=[];
                  for(let i=0;i<cells.length;i+=7) rows.push(cells.slice(i,i+7));
                  return(
                    <div style={{display:"grid",gridTemplateRows:`repeat(${rows.length},minmax(120px,1fr))`,height:"100%"}}>
                      {rows.map((row,ri)=>(
                        <div key={ri} className="grid grid-cols-7">
                          {row.map((d,ci)=>{
                            if(!d) return <div key={ci} className="border-r border-b border-slate-100 bg-slate-50/60 last:border-r-0"/>;
                            const ds=format(d,"yyyy-MM-dd");
                            const tod=isToday(d);
                            const isPast=d<new Date(new Date().setHours(0,0,0,0));
                            const dayApts=appointments.filter(a=>format(a.date,"yyyy-MM-dd")===ds&&a.status!=="cancelled");
                            const isDayBlocked=blockedDays.has(ds);
                            return(
                              <div key={ds}
                                onClick={()=>{setOverlayDay(d);setOverlayView("day");}}
                                className={`border-r border-b border-slate-100 last:border-r-0 p-2 cursor-pointer transition-colors group flex flex-col
                                  ${tod?"bg-[#d91c1c]/[0.04] hover:bg-[#d91c1c]/[0.08]":isDayBlocked?"bg-slate-100 hover:bg-slate-200":isPast?"bg-slate-50 hover:bg-slate-100":"bg-white hover:bg-slate-50"}`}>
                                <div className="flex items-center justify-between mb-1.5 shrink-0">
                                  <span className={`inline-flex w-7 h-7 items-center justify-center rounded-full text-sm font-black leading-none ${tod?"bg-[#d91c1c] text-white":isPast?"text-slate-300":isDayBlocked?"text-slate-400":"text-slate-800"}`}>{format(d,"d")}</span>
                                  {!isDayBlocked&&!isPast&&dayApts.length===0&&<span className="text-[9px] font-bold text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">Vrij</span>}
                                  {isDayBlocked&&<span className="text-[9px] font-bold text-slate-400">Geblokkeerd</span>}
                                </div>
                                <div className="space-y-1 flex-1 min-h-0 overflow-hidden">
                                  {dayApts.slice(0,3).map(apt=>(
                                    <div key={apt.id} className={`rounded-md px-1.5 py-1 border-l-2 ${apt.status==="pending"?"bg-amber-50 border-amber-400":"bg-green-50 border-green-500"}`}>
                                      <p className="text-[10px] font-black text-slate-800 leading-tight truncate">{apt.name}</p>
                                      <p className="text-[9px] text-slate-500 font-medium leading-tight truncate">{apt.timeSlot} · {apt.service}</p>
                                    </div>
                                  ))}
                                  {dayApts.length>3&&<p className="text-[9px] font-bold text-slate-400 pl-1">+{dayApts.length-3} meer</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </>
          )}

          {/* ── WEEK VIEW ─────────────────────────────────────────────────────── */}
          {overlayView==="week"&&(()=>{
            const ws=startOfWeek(overlayWeekAnchor,{weekStartsOn:1});
            const weekDays7=Array.from({length:7},(_,i)=>addDays(ws,i));
            return(
              <>
                {/* Day headers */}
                <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-slate-200 shrink-0 bg-slate-50">
                  <div className="border-r border-slate-200"/>
                  {weekDays7.map(d=>{
                    const tod=isToday(d);
                    return(
                      <div key={d.toISOString()} onClick={()=>{setOverlayDay(d);setOverlayView("day");}}
                        className={`py-3 px-2 text-center border-r border-slate-200 last:border-r-0 cursor-pointer hover:bg-white transition-colors ${tod?"bg-[#d91c1c]/5":""}`}>
                        <p className={`text-[10px] font-bold uppercase tracking-wider ${tod?"text-[#d91c1c]":"text-slate-400"}`}>{format(d,"EEE",{locale:nl})}</p>
                        <div className={`mx-auto mt-0.5 w-8 h-8 flex items-center justify-center rounded-full ${tod?"bg-[#d91c1c]":""}`}>
                          <p className={`text-base font-black leading-none ${tod?"text-white":"text-slate-800"}`}>{format(d,"d")}</p>
                        </div>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5 capitalize">{format(d,"MMM",{locale:nl})}</p>
                      </div>
                    );
                  })}
                </div>
                {/* Slot rows */}
                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-[64px_repeat(7,1fr)] h-full">
                    {/* Time labels */}
                    <div className="border-r border-slate-100">
                      {ALL_SLOTS.map(slot=>(
                        <div key={slot} style={{minHeight:"72px"}} className="border-b border-slate-100 last:border-b-0 flex items-start justify-end px-2 pt-2.5">
                          <span className="text-[11px] font-bold text-slate-400">{slot}</span>
                        </div>
                      ))}
                    </div>
                    {weekDays7.map(d=>{
                      const ds=format(d,"yyyy-MM-dd");
                      const isDayBlocked=blockedDays.has(ds);
                      const renderedSlots=new Set<string>();
                      return(
                        <div key={ds} className="border-r border-slate-100 last:border-r-0 relative">
                          {ALL_SLOTS.map(slot=>{
                            const slotApts=appointments.filter(a=>format(a.date,"yyyy-MM-dd")===ds&&a.timeSlot===slot&&a.status!=="cancelled");
                            const coveredBySpan=renderedSlots.has(slot);
                            // Mark follow-on slots as covered
                            slotApts.forEach(apt=>{
                              const dur=apt.durationHours??1;
                              if(dur>1){
                                const idx=ALL_SLOTS.indexOf(apt.timeSlot);
                                for(let i=1;i<dur;i++){
                                  if(ALL_SLOTS[idx+i]) renderedSlots.add(ALL_SLOTS[idx+i]);
                                }
                              }
                            });
                            // If covered by a spanning card, render transparent spacer
                            if(coveredBySpan) return <div key={slot} style={{minHeight:"72px"}}/>;
                            const isSlotBlocked=!isDayBlocked&&(blockedSlots[ds]?.has(slot)??false);
                            const blocked=isDayBlocked||isSlotBlocked;
                            const hasSpan=slotApts.some(a=>(a.durationHours??1)>1);
                            return(
                              <div key={slot} style={{minHeight:"72px",backgroundImage:blocked?"repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(0,0,0,0.03) 4px,rgba(0,0,0,0.03) 8px)":""}} className={`${hasSpan?"":"border-b border-slate-100"} last:border-b-0 p-1 relative ${blocked?"bg-slate-100":""}`}>
                                {!blocked&&slotApts.map(apt=>{
                                  const dur=apt.durationHours??1;
                                  const cardH=dur*72-4;
                                  return(
                                    <div key={apt.id} style={{height:cardH,zIndex:20}} className={`${dur>1?"absolute left-1 right-1 top-0.5":""} rounded-lg px-2 py-1.5 border-l-2 mb-1 ${apt.status==="pending"?"bg-amber-50 border-amber-400":"bg-green-50 border-green-500"}`}>
                                      <p className="text-[11px] font-black text-slate-800 leading-tight truncate">{apt.name}</p>
                                      <p className="text-[9px] text-slate-500 font-medium mt-0.5 truncate">{apt.service}</p>
                                      {dur>1&&<p className="text-[9px] font-bold text-slate-400 mt-0.5">{dur}u</p>}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            );
          })()}

          {/* ── DAY VIEW ──────────────────────────────────────────────────────── */}
          {overlayView==="day"&&(()=>{
            const ds=format(overlayDay,"yyyy-MM-dd");
            const isDayBlocked=blockedDays.has(ds);
            const dayApts=appointments.filter(a=>format(a.date,"yyyy-MM-dd")===ds&&a.status!=="cancelled");
            return(
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {isDayBlocked&&(
                  <div className="mb-4 bg-slate-100 border border-slate-200 rounded-2xl px-5 py-4 flex items-center gap-3">
                    <Ban size={16} className="text-slate-500 shrink-0"/>
                    <p className="text-sm font-bold text-slate-600">Deze dag is volledig geblokkeerd.</p>
                  </div>
                )}
                {dayApts.length===0&&!isDayBlocked&&(
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
                      <CheckCircle size={24} className="text-green-400"/>
                    </div>
                    <p className="font-black text-slate-700">Volledige dag beschikbaar</p>
                    <p className="text-sm text-slate-400 mt-1">Geen afspraken gepland voor {format(overlayDay,"d MMMM",{locale:nl})}</p>
                  </div>
                )}
                <div className="space-y-0">
                  {(()=>{
                    const coveredSlots=new Map<string,{apt:typeof dayApts[0]}>();
                    // Pre-compute which slots are covered by multi-hour appointments
                    for(const apt of dayApts){
                      const dur=apt.durationHours??1;
                      if(dur>1){
                        const idx=ALL_SLOTS.indexOf(apt.timeSlot);
                        for(let i=1;i<dur;i++){
                          if(ALL_SLOTS[idx+i]) coveredSlots.set(ALL_SLOTS[idx+i],{apt});
                        }
                      }
                    }
                    return ALL_SLOTS.map(slot=>{
                      const slotApts=dayApts.filter(a=>a.timeSlot===slot);
                      const isSlotBlocked=!isDayBlocked&&(blockedSlots[ds]?.has(slot)??false);
                      const covered=coveredSlots.get(slot);
                      // Slot is covered by a spanning appointment — show as occupied
                      if(covered&&!isSlotBlocked){
                        return(
                          <div key={slot} className="flex gap-4 items-start rounded-xl px-4 py-3 bg-green-50/40">
                            <span className="text-sm font-black w-14 shrink-0 pt-0.5 text-slate-300">{slot}</span>
                            <span className="text-xs font-bold text-green-500/60 pt-1">Bezet · {covered.apt.name}</span>
                          </div>
                        );
                      }
                      return(
                        <div key={slot} className={`flex gap-4 items-start rounded-xl px-4 py-3 ${isSlotBlocked?"bg-slate-100":slotApts.length>0?"":"hover:bg-slate-50 group"}`}>
                          <span className={`text-sm font-black w-14 shrink-0 pt-0.5 ${slotApts.length>0?"text-slate-700":isSlotBlocked?"text-slate-400":"text-slate-300 group-hover:text-slate-400"}`}>{slot}</span>
                          {isSlotBlocked&&<span className="text-xs font-bold text-slate-400 pt-1">Geblokkeerd</span>}
                          {!isSlotBlocked&&slotApts.length===0&&<span className="text-xs font-medium text-slate-300 pt-1 group-hover:text-green-500 transition-colors">Vrij</span>}
                          <div className="flex gap-3 flex-wrap flex-1">
                            {slotApts.map(apt=>{
                              const dur=apt.durationHours??1;
                              return(
                                <div key={apt.id} className={`flex-1 min-w-[200px] rounded-xl px-4 py-3 border-l-4 shadow-sm ${apt.status==="pending"?"bg-amber-50 border-amber-400":"bg-green-50 border-green-500"}`}>
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <p className="font-black text-slate-900 text-sm">{apt.name}</p>
                                      <p className="text-xs text-slate-500 font-medium mt-0.5">{apt.service}</p>
                                    </div>
                                    {dur>1&&<span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full shrink-0">{dur}u · {apt.timeSlot}–{ALL_SLOTS[ALL_SLOTS.indexOf(apt.timeSlot)+dur]??`${parseInt(apt.timeSlot)+dur}:00`}</span>}
                                  </div>
                                  <div className="flex items-center gap-3 mt-2">
                                    <a href={`mailto:${apt.email}`} className="text-[11px] text-[#d91c1c] font-medium hover:underline flex items-center gap-1"><Mail size={10}/>{apt.email}</a>
                                    <a href={`tel:${apt.phone}`} className="text-[11px] text-slate-500 font-medium hover:underline flex items-center gap-1"><Phone size={10}/>{apt.phone}</a>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            );
          })()}

        </div>
        </div>
      )}



      {/* ── CONFIRM modal ─────────────────────────────────────────────────────── */}
      {confirmModalId&&(()=>{
        const apt=appointments.find(a=>a.id===confirmModalId);
        const allSlots=generateDaySlots();
        const startIdx=apt?allSlots.indexOf(apt.timeSlot):0;
        const maxDuration=Math.min(8, allSlots.length-startIdx);
        return(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}} onClick={e=>e.target===e.currentTarget&&dispatch({type:"CLOSE_CONFIRM"})}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center"><CheckCircle size={18} className="text-green-600"/></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">Bevestigen</p>
                  <h3 className="text-base font-black text-slate-900 leading-tight">{apt?.name}</h3>
                  <p className="text-xs text-slate-500 font-medium">{apt&&format(apt.date,"d MMM",{locale:nl})} · {apt?.timeSlot}</p>
                </div>
              </div>
              <button onClick={()=>dispatch({type:"CLOSE_CONFIRM"})} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"><X size={20}/></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Hoe lang duurt deze afspraak?</label>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({length:maxDuration},(_,i)=>i+1).map(h=>(
                    <button key={h} type="button" onClick={()=>dispatch({type:"SET_CONFIRM_DURATION",duration:h})}
                      className={`py-3 rounded-xl border text-sm font-black transition-all ${confirmDuration===h?"bg-green-600 border-green-600 text-white shadow-sm":"border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-700"}`}>
                      {h}u
                    </button>
                  ))}
                </div>
                {confirmDuration>1&&(
                  <p className="text-xs text-amber-600 font-medium mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                    Van {apt?.timeSlot} tot {slotEndTime(apt?.timeSlot??"08:00", confirmDuration)} wordt geblokkeerd.
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={()=>dispatch({type:"CLOSE_CONFIRM"})} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">Annuleren</button>
                <button onClick={handleConfirmSubmit} disabled={confirmSub}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-bold rounded-xl text-sm hover:bg-green-700 disabled:opacity-60 transition-all">
                  {confirmSub?<><Loader2 size={15} className="animate-spin"/>Bezig&hellip;</>:<><CheckCircle size={15}/>Bevestigen</>}
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* ── CREATE modal ─────────────────────────────────────────────────────── */}
      {createOpen&&<AptModal title="Nieuwe afspraak" icon={<CalendarPlus size={18} className="text-[#d91c1c]"/>} form={createForm} setForm={(f)=>dispatch({type:"SET_CREATE_FORM",form:f})} errors={createErrors} serverError={createError} submitting={createSub} pickerMonth={createMonth} setPickerMonth={(d)=>dispatch({type:"SET_CREATE_MONTH",month:d})} availSlots={availCreate} today={today} onSubmit={handleCreateSubmit} onClose={()=>dispatch({type:"CLOSE_CREATE"})} submitLabel="Afspraak aanmaken" showStatus={false} infoNote={<>Handmatig aangemaakte afspraken worden direct als <span className="font-bold text-green-600">Bevestigd</span> opgeslagen.</>}/>}

      {/* ── EDIT modal ───────────────────────────────────────────────────────── */}
      {editOpen&&<AptModal title="Afspraak bewerken" icon={<Pencil size={18} className="text-[#d91c1c]"/>} form={editForm} setForm={(f)=>dispatch({type:"SET_EDIT_FORM",form:f})} errors={editErrors} serverError={editError} submitting={editSub} pickerMonth={editMonth} setPickerMonth={(d)=>dispatch({type:"SET_EDIT_MONTH",month:d})} availSlots={availEdit} today={today} onSubmit={handleEditSubmit} onClose={()=>dispatch({type:"CLOSE_EDIT"})} submitLabel="Wijzigingen opslaan" showStatus={true}/>}

      {/* ── BLOCK modal ─────────────────────────────────────────────────────── */}
      {blockOpen&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}} onClick={e=>e.target===e.currentTarget&&dispatch({type:"CLOSE_BLOCK"})}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"><Ban size={18} className="text-slate-700"/></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Admin</p>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">Dag of slot blokkeren</h3>
                </div>
              </div>
              <button onClick={()=>dispatch({type:"CLOSE_BLOCK"})} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleBlockSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Datum *</label>
                <div className="flex items-center justify-between mb-2">
                  <button type="button" onClick={()=>dispatch({type:"SET_BLOCK_MONTH",month:subMonths(blockMonth,1)})} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><ChevronLeft size={14}/></button>
                  <p className="text-xs font-bold text-slate-700 capitalize">{format(blockMonth,"MMMM yyyy",{locale:nl})}</p>
                  <button type="button" onClick={()=>dispatch({type:"SET_BLOCK_MONTH",month:addMonths(blockMonth,1)})} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><ChevronRight size={14}/></button>
                </div>
                <div className="grid grid-cols-7 mb-1">{["Ma","Di","Wo","Do","Vr","Za","Zo"].map(l=><div key={l} className="text-center text-[9px] font-bold text-slate-400">{l}</div>)}</div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({length:mondayIndex(startOfMonth(blockMonth))}).map((_,i)=><div key={i}/>)}
                  {eachDayOfInterval({start:startOfMonth(blockMonth),end:endOfMonth(blockMonth)}).map(d=>{
                    const ds=format(d,"yyyy-MM-dd");
                    const sel=blockForm.dateStr===ds;
                    const past=d<today;
                    return <button type="button" key={ds} disabled={past} onClick={()=>dispatch({type:"SET_BLOCK_FORM",form:{...blockForm,dateStr:ds}})}
                      className={`aspect-square w-full rounded-md flex items-center justify-center text-[11px] font-bold transition-all ${sel?"bg-slate-900 text-white":past?"text-slate-300 cursor-not-allowed":"hover:bg-slate-100 text-slate-700 cursor-pointer"}`}>
                      {format(d,"d")}
                    </button>;
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Blokkeer</label>
                <div className="flex gap-2">
                  <button type="button" onClick={()=>dispatch({type:"SET_BLOCK_FORM",form:{...blockForm,slot:null}})} className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${blockForm.slot===null?"bg-slate-900 text-white border-slate-900":"border-slate-200 text-slate-500 hover:border-slate-400"}`}>Volledige dag</button>
                  <div className="flex-1">
                    <select value={blockForm.slot??""} onChange={e=>dispatch({type:"SET_BLOCK_FORM",form:{...blockForm,slot:e.target.value||null}})}
                      className={`w-full px-3 py-2.5 rounded-xl border text-xs font-bold text-slate-700 outline-none transition-colors bg-white ${blockForm.slot?"border-slate-900":"border-slate-200"}`}>
                      <option value="">Specifiek tijdslot&hellip;</option>
                      {ALL_SLOTS.map(s=><option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Reden (optioneel)</label>
                <input type="text" placeholder="bv. Verlof, Onderhoud&hellip;" value={blockForm.reason} onChange={e=>dispatch({type:"SET_BLOCK_FORM",form:{...blockForm,reason:e.target.value}})} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-slate-900 text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-colors"/>
              </div>
              {blockError&&<div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium"><X size={15} className="shrink-0 mt-0.5"/>{blockError}</div>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={()=>dispatch({type:"CLOSE_BLOCK"})} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">Annuleren</button>
                <button type="submit" disabled={blockSub} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-700 disabled:opacity-60 transition-all">
                  {blockSub?<><Loader2 size={15} className="animate-spin"/>Bezig&hellip;</>:<><Ban size={14}/>Blokkeren</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    );
}


// ─── Shared AptModal ──────────────────────────────────────────────────────────

function AptModal({title,icon,form,setForm,errors,serverError,submitting,pickerMonth,setPickerMonth,availSlots,today,onSubmit,onClose,submitLabel,showStatus,infoNote}:{
    title:string;icon:React.ReactNode;form:AptForm;setForm:(f:AptForm)=>void;
    errors:Partial<AptForm>;serverError:string|null;submitting:boolean;
    pickerMonth:Date;setPickerMonth:(d:Date)=>void;availSlots:string[];today:Date;
    onSubmit:(e:React.FormEvent)=>void;onClose:()=>void;submitLabel:string;showStatus:boolean;infoNote?:React.ReactNode;
}) {
    const days=eachDayOfInterval({start:startOfMonth(pickerMonth),end:endOfMonth(pickerMonth)});
    const lead=mondayIndex(startOfMonth(pickerMonth));
    const slotIdx = form.slot ? ALL_SLOTS.indexOf(form.slot) : -1;
    const maxDuration = slotIdx >= 0 ? Math.min(8, ALL_SLOTS.length - slotIdx) : 8;

    return(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:"rgba(0,0,0,0.6)",backdropFilter:"blur(4px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden" style={{maxHeight:"92vh"}}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#d91c1c]/10 flex items-center justify-center">{icon}</div>
            <div><p className="text-[10px] font-bold uppercase tracking-widest text-[#d91c1c]">Admin</p><h3 className="text-lg font-black text-slate-900 leading-tight">{title}</h3></div>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors"><X size={20}/></button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-5">
          <form onSubmit={onSubmit} noValidate>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Datum *</label>
                  <div className="flex items-center justify-between mb-2">
                    <button type="button" onClick={()=>setPickerMonth(subMonths(pickerMonth,1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><ChevronLeft size={14}/></button>
                    <p className="text-xs font-bold text-slate-700 capitalize">{format(pickerMonth,"MMMM yyyy",{locale:nl})}</p>
                    <button type="button" onClick={()=>setPickerMonth(addMonths(pickerMonth,1))} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"><ChevronRight size={14}/></button>
                  </div>
                  <div className="grid grid-cols-7 mb-1">{["Ma","Di","Wo","Do","Vr","Za","Zo"].map(l=><div key={l} className="text-center text-[9px] font-bold text-slate-400">{l}</div>)}</div>
                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({length:lead}).map((_,i)=><div key={i}/>)}
                    {days.map(d=>{const ds=format(d,"yyyy-MM-dd");const sel=form.dateStr===ds;const past=d<today;return(
                      <button type="button" key={ds} disabled={past} onClick={()=>setForm({...form,dateStr:ds,slot:""})}
                        className={`aspect-square w-full rounded-md flex items-center justify-center text-[11px] font-bold transition-all ${sel?"bg-[#d91c1c] text-white":past?"text-slate-300 cursor-not-allowed":"hover:bg-slate-100 text-slate-700 cursor-pointer"}`}>
                        {format(d,"d")}
                      </button>
                    );})}
                  </div>
                  {errors.dateStr&&<p className="text-red-500 text-xs mt-1">{errors.dateStr}</p>}
                </div>
                {/* Slot picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Tijdslot *</label>
                  {!form.dateStr?<p className="text-xs text-slate-400 font-medium mt-6">Selecteer eerst een datum</p>:(
                    <div className="grid grid-cols-2 gap-1.5">
                      {ALL_SLOTS.map(s=>{const avail=availSlots.includes(s)||form.slot===s;const sel=form.slot===s;return(
                        <button type="button" key={s} disabled={!avail} onClick={()=>setForm({...form,slot:s})}
                          className={`py-2 rounded-lg border text-xs font-bold transition-all ${sel?"bg-[#d91c1c] border-[#d91c1c] text-white":avail?"border-slate-200 text-slate-700 hover:border-[#d91c1c] hover:text-[#d91c1c]":"border-slate-100 text-slate-300 cursor-not-allowed line-through"}`}>
                          {s}{!avail&&<span className="ml-1 text-[9px]">bezet</span>}
                        </button>
                      );})}
                    </div>
                  )}
                  {errors.slot&&<p className="text-red-500 text-xs mt-1">{errors.slot}</p>}
                </div>
              </div>

              {/* Duration picker — shown once a slot is selected */}
              {form.slot&&(
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Duur afspraak</label>
                  <div className="flex gap-2 flex-wrap">
                    {Array.from({length:maxDuration},(_,i)=>i+1).map(h=>(
                      <button key={h} type="button"
                        onClick={()=>setForm({...form,durationHours:h})}
                        className={`px-4 py-2 rounded-xl border text-sm font-black transition-all ${(form.durationHours??1)===h?"bg-[#d91c1c] border-[#d91c1c] text-white shadow-sm":"border-slate-200 text-slate-600 hover:border-[#d91c1c] hover:text-[#d91c1c]"}`}>
                        {h}u
                      </button>
                    ))}
                  </div>
                  {(form.durationHours??1)>1&&(
                    <p className="text-xs text-amber-600 font-medium mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                      Van {form.slot} tot {slotEndTime(form.slot, form.durationHours??1)} wordt geblokkeerd.
                    </p>
                  )}
                </div>
              )}

              <hr className="border-slate-100"/>
              {showStatus&&(
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Status *</label>
                  <div className="flex gap-2">
                    {(["pending","confirmed","cancelled"] as const).map(s=>(
                      <button type="button" key={s} onClick={()=>setForm({...form,status:s})}
                        className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all ${form.status===s?(s==="confirmed"?"bg-green-600 border-green-600 text-white":s==="pending"?"bg-amber-500 border-amber-500 text-white":"bg-slate-600 border-slate-600 text-white"):"border-slate-200 text-slate-500 hover:border-slate-400"}`}>
                        {s==="pending"?"Wachtend":s==="confirmed"?"Bevestigd":"Geannuleerd"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Naam *" id="f-name" error={errors.name}><input id="f-name" type="text" placeholder="Voornaam Achternaam" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={ic(!!errors.name)}/></Field>
                <Field label="Telefoon *" id="f-phone" error={errors.phone}><input id="f-phone" type="tel" placeholder="+32 4xx xx xx xx" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className={ic(!!errors.phone)}/></Field>
                <Field label="E-mailadres *" id="f-email" error={errors.email} cls="sm:col-span-2"><input id="f-email" type="email" placeholder="klant@email.be" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className={ic(!!errors.email)}/></Field>
                <Field label="Dienst *" id="f-svc" error={errors.service} cls="sm:col-span-2"><select id="f-svc" value={form.service} onChange={e=>setForm({...form,service:e.target.value})} className={ic(!!errors.service)+" bg-white"}><option value="">Selecteer een dienst...</option>{APPOINTMENT_CONFIG.services.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
                <Field label="Opmerkingen" id="f-notes" cls="sm:col-span-2"><textarea id="f-notes" rows={2} placeholder="Optionele notitie…" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className={ic(false)+" resize-none"}/></Field>
              </div>
              {serverError&&<div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium"><X size={15} className="shrink-0 mt-0.5"/>{serverError}</div>}
              {infoNote&&<p className="text-xs text-slate-400 font-medium bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">{infoNote}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors">Annuleren</button>
                <button type="submit" disabled={submitting} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#d91c1c] text-white font-bold rounded-xl text-sm hover:bg-[#b91515] disabled:opacity-60 transition-all">
                  {submitting?<><Loader2 size={15} className="animate-spin"/>Bezig…</>:<><CheckCircle size={15}/>{submitLabel}</>}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
    );
}

function ic(err:boolean){return`w-full px-3 py-2.5 rounded-xl border text-sm font-medium text-slate-900 placeholder-slate-400 outline-none transition-colors ${err?"border-red-400 focus:border-red-500":"border-slate-200 focus:border-[#d91c1c]"}`;}
function Field({label,id,error,children,cls=""}:{label:string;id:string;error?:string;children:React.ReactNode;cls?:string}){
    return <div className={cls}><label htmlFor={id} className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">{label}</label>{children}{error&&<p className="text-red-500 text-xs mt-1 font-medium">{error}</p>}</div>;
}

// ─── Calendar cell popover ────────────────────────────────────────────────────

function CalendarPopover({apt,onClose,onEdit,onConfirm,onCancel,isPending}:{
    apt:Appointment;onClose:()=>void;onEdit:()=>void;
    onConfirm:(id:string)=>void;onCancel:(id:string)=>void;isPending:boolean;
}){return(
    <div className="relative z-30 mt-1">
      <div className="fixed inset-0 z-10" onClick={onClose}/>
      <div className="absolute left-0 top-0 z-30 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-black text-slate-900 text-sm">{apt.name}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{apt.service}</p>
            <div className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${apt.status==="pending"?"bg-amber-50 text-amber-700 border-amber-200":"bg-green-50 text-green-700 border-green-200"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[apt.status]}`}/>{STATUS_LABELS[apt.status]}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 text-xl leading-none ml-2 shrink-0">×</button>
        </div>
        <div className="space-y-1.5 mb-3 pb-3 border-b border-slate-100">
          <a href={`mailto:${apt.email}`} className="flex items-center gap-2 text-xs text-[#d91c1c] font-medium hover:underline"><Mail size={12} className="text-slate-400 shrink-0"/>{apt.email}</a>
          <a href={`tel:${apt.phone}`} className="flex items-center gap-2 text-xs text-slate-600 font-medium hover:underline"><Phone size={12} className="text-slate-400 shrink-0"/>{apt.phone}</a>
          {apt.notes&&<div className="flex items-start gap-2 text-xs text-slate-500"><MessageSquare size={12} className="text-slate-300 shrink-0 mt-0.5"/>{apt.notes}</div>}
          {(apt.durationHours??1)>1&&<p className="text-xs font-bold text-slate-500">⏱ {apt.durationHours}u afspraak</p>}
        </div>
        <div className="flex flex-col gap-2">
          <button onClick={onEdit} className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors"><Pencil size={12}/>Afspraak bewerken</button>
          <div className="flex gap-2">
            {apt.status==="pending"&&<button onClick={()=>{onConfirm(apt.id);onClose();}} disabled={isPending} className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-colors"><CheckCircle size={12}/>Bevestigen</button>}
            <button onClick={()=>{onCancel(apt.id);onClose();}} disabled={isPending} className="flex-1 flex items-center justify-center gap-1 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition-colors"><XCircle size={12}/>Annuleren</button>
          </div>
        </div>
      </div>
    </div>
);}
