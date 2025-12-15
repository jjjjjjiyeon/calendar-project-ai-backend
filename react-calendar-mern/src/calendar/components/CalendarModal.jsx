// src/calendar/components/CalendarModal.jsx
import { useMemo, useState, useEffect } from "react";
import { addHours, differenceInSeconds } from "date-fns";
import Modal from "react-modal";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

import DatePicker from "react-datepicker";
import ko from "date-fns/locale/ko";
import "react-datepicker/dist/react-datepicker.css";

import { useCalendarStore } from "../../hooks/useCalendarStore";
import "./CalendarModal.css";

Modal.setAppElement("#root");

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    transform: "translate(-50%, -50%)",
    borderRadius: "16px",
    padding: "0",
    border: "none",
  },
  overlay: {
    backgroundColor: "rgba(0,0,0,0.35)",
    zIndex: 999,
  },
};

const PASTEL_COLORS = ["#A5B4FC", "#FBCFE8", "#FDE68A", "#BFDBFE", "#C7F9CC"];

export const CalendarModal = () => {
  const {
    activeEvent,
    calendars,
    selectedCalendars = [],
    startSavingEvent,
    startDeletingEvent,
    clearActiveEvent,
  } = useCalendarStore();

  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    setIsOpen(!!activeEvent);
  }, [activeEvent]);

  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formValues, setFormValues] = useState({
    title: "",
    notes: "",
    start: new Date(),
    end: addHours(new Date(), 2),
    calendarId: "",
    color: PASTEL_COLORS[0],
  });

  useEffect(() => {
    if (activeEvent) {
      const cid =
        activeEvent.calendarId ||
        selectedCalendars[0] ||
        "";

      setFormValues({
        title: activeEvent.title || "",
        notes: activeEvent.notes || "",
        start: activeEvent.start ? new Date(activeEvent.start) : new Date(),
        end: activeEvent.end ? new Date(activeEvent.end) : addHours(new Date(), 2),
        _id: activeEvent._id || activeEvent.id,
        calendarId: String(cid),
        color: activeEvent.color || PASTEL_COLORS[0],
      });
    }
  }, [activeEvent, selectedCalendars]);

  const titleClass = useMemo(() => {
    if (!formSubmitted) return "";
    return formValues.title.trim().length > 0 ? "" : "is-invalid";
  }, [formValues.title, formSubmitted]);

  const onInputChanged = ({ target }) =>
    setFormValues((s) => ({ ...s, [target.name]: target.value }));

  const onDateChanged = (date, which) =>
    setFormValues((s) => ({ ...s, [which]: date }));

  const onCloseModal = () => {
    setIsOpen(false);
    setFormSubmitted(false);
    clearActiveEvent();
  };

  // ======== 📌 Viewer 권한 확인 함수 ==========
  const isViewer = () => {
    const cal = calendars.find((c) => c.id === formValues.calendarId);
    return cal?.role === "viewer";
  };

  // =============== 저장 =====================
  const onSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);

    // Viewer 차단
    if (isViewer()) {
      Swal.fire("권한 없음", "이 캘린더에서는 일정을 수정할 수 없어요.", "error");
      return;
    }

    const diff = differenceInSeconds(formValues.end, formValues.start);
    if (isNaN(diff) || diff <= 0) {
      Swal.fire("날짜/시간 오류", "시작과 종료를 다시 확인해주세요.", "error");
      return;
    }
    if (formValues.title.trim().length === 0) return;

    try {
      await startSavingEvent(formValues);
      setFormSubmitted(false);
      onCloseModal();
    } catch (err) {
      if (err?.message === "viewer-no-edit") {
        Swal.fire("권한 없음", "일정을 수정/등록할 수 없어요.", "error");
        return;
      }
      Swal.fire("저장 실패", "일정 저장 중 문제가 발생했어요.", "error");
    }
  };

  // ============= 삭제 ======================
  const onDelete = async () => {
    if (isViewer()) {
      Swal.fire("권한 없음", "일정을 삭제할 수 없어요.", "error");
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: "이 일정을 삭제할까요?",
      text: "삭제 후 복구할 수 없어요.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "삭제",
      cancelButtonText: "취소",
      confirmButtonColor: "#e5534b",
    });
    if (!isConfirmed) return;

    try {
      await startDeletingEvent();
      onCloseModal();
    } catch (err) {
      if (err?.message === "viewer-no-delete") {
        Swal.fire("권한 없음", "일정을 삭제할 수 없어요.", "error");
        return;
      }
      Swal.fire("삭제 실패", "일정 삭제 중 문제가 발생했어요.", "error");
    }
  };

  const isEdit = !!formValues._id;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onCloseModal}
      style={customStyles}
      className="modal"
      overlayClassName="modal-fondo"
      closeTimeoutMS={150}
    >
      <div className="modal-header">
        <h2>{isEdit ? "일정 수정" : "일정 추가"}</h2>
      </div>

      <form className="modal-form" onSubmit={onSubmit}>
        {/* 날짜 구간 */}
        <div className="date-row">
          <div className="date-field">
            <label>시작</label>
            <DatePicker
              selected={formValues.start}
              onChange={(date) => onDateChanged(date, "start")}
              className="form-control"
              dateFormat="yyyy.MM.dd HH:mm"
              showTimeSelect
              timeIntervals={30}
              locale={ko}
            />
          </div>

          <div className="date-field">
            <label>종료</label>
            <DatePicker
              minDate={formValues.start}
              selected={formValues.end}
              onChange={(date) => onDateChanged(date, "end")}
              className="form-control"
              dateFormat="yyyy.MM.dd HH:mm"
              showTimeSelect
              timeIntervals={30}
              locale={ko}
            />
          </div>
        </div>

        <label>제목</label>
        <input
          type="text"
          className={`form-control ${titleClass}`}
          placeholder="일정 제목"
          name="title"
          value={formValues.title}
          onChange={onInputChanged}
        />

        <label>메모</label>
        <textarea
          className="form-control"
          placeholder="메모를 입력하세요"
          rows="4"
          name="notes"
          value={formValues.notes}
          onChange={onInputChanged}
        />

        {/* 색상 */}
        <label>색상</label>
        <div className="color-picker">
          {PASTEL_COLORS.map((c) => (
            <label
              key={c}
              className={`swatch ${formValues.color === c ? "selected" : ""}`}
              style={{ "--swatch": c }}
            >
              <input
                type="radio"
                name="color"
                value={c}
                checked={formValues.color === c}
                onChange={onInputChanged}
              />
              <span className="dot" aria-label={`색상 ${c}`} />
            </label>
          ))}
        </div>

        <div className="modal-footer">
          <div className="left-actions">
            {isEdit && (
              <button type="button" className="btn-delete" onClick={onDelete}>
                삭제
              </button>
            )}
          </div>

          <div className="right-actions">
            <button type="button" className="btn-cancel" onClick={onCloseModal}>
              취소
            </button>
            <button type="submit" className="btn-save">
              저장
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
