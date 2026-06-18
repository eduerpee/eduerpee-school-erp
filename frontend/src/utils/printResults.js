export function printResults(selExam, studentResults, classes, resultsClass) {
  const school = (() => { try { return JSON.parse(localStorage.getItem('school_settings')) || {}; } catch { return {}; } })();
  const className = classes.find(c => c.id === resultsClass)?.name || 'All Classes';

  function gradeColor(g) {
    const map = {'A+':'#065F46','A':'#065F46','B+':'#1E40AF','B':'#1E40AF','C':'#92400E','D':'#92400E','F':'#991B1B','AB':'#6B7280'};
    return map[g] || '#374151';
  }
  function calcGrade(pct) {
    if (pct >= 90) return 'A+'; if (pct >= 80) return 'A'; if (pct >= 70) return 'B+';
    if (pct >= 60) return 'B'; if (pct >= 50) return 'C'; if (pct >= 33) return 'D'; return 'F';
  }

  const pages = studentResults.map((stu, idx) => {
    const totalObtained = stu.subjects.filter(s => !s.is_absent).reduce((sum, s) => sum + (parseFloat(s.marks_obtained) || 0), 0);
    const totalMax      = stu.subjects.reduce((sum, s) => sum + (s.max_marks || 0), 0);
    const pct           = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    const passed        = stu.subjects.every(s => s.is_absent || (parseFloat(s.marks_obtained) || 0) >= (s.pass_marks || 33));
    const overallGrade  = calcGrade(pct);
    const initials = stu.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const photoHtml = stu.photo
      ? '<img src="' + stu.photo + '" style="width:54px;height:54px;border-radius:10px;object-fit:cover;border:2px solid #E5E7EB;flex-shrink:0"/>'
      : '<div style="width:54px;height:54px;border-radius:10px;background:linear-gradient(135deg,#7C3AED,#1E1B4B);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;flex-shrink:0">' + initials + '</div>';

    const subjectRows = stu.subjects.map((r, i) => {
      const mo  = r.is_absent ? null : (parseFloat(r.marks_obtained) || 0);
      const sp  = r.is_absent ? false : mo >= (r.pass_marks || 33);
      const g   = r.is_absent ? 'AB' : (r.grade || '—');
      const bar = r.is_absent ? 0 : Math.round((mo / r.max_marks) * 100);
      const gc  = gradeColor(g);
      return (
        '<tr style="background:' + (i % 2 === 0 ? '#fff' : '#F9FAFB') + '">' +
        '<td style="text-align:center;color:#9CA3AF;font-size:9px;padding:6px 8px">' + (i + 1) + '</td>' +
        '<td style="font-weight:600;padding:6px 8px">' + r.subject_name + '</td>' +
        '<td style="text-align:center;padding:6px 8px">' + r.max_marks + '</td>' +
        '<td style="text-align:center;padding:6px 8px">' + (r.pass_marks || 33) + '</td>' +
        '<td style="text-align:center;font-weight:700;padding:6px 8px;color:' + (r.is_absent ? '#6B7280' : sp ? '#065F46' : '#991B1B') + '">' + (r.is_absent ? 'AB' : mo) + '</td>' +
        '<td style="text-align:center;padding:6px 8px"><span style="background:' + gc + '18;color:' + gc + ';border:1px solid ' + gc + '40;padding:2px 7px;border-radius:20px;font-size:9px;font-weight:800">' + g + '</span></td>' +
        '<td style="text-align:center;padding:6px 8px">' +
          '<div style="height:5px;background:#F3F4F6;border-radius:3px;overflow:hidden;margin-bottom:2px">' +
          '<div style="height:100%;width:' + bar + '%;background:' + (sp ? '#10B981' : '#EF4444') + ';border-radius:3px"></div></div>' +
          '<span style="font-size:9px;font-weight:600;color:' + (r.is_absent ? '#6B7280' : sp ? '#065F46' : '#991B1B') + '">' + (r.is_absent ? 'Absent' : sp ? 'Pass' : 'Fail') + '</span>' +
        '</td></tr>'
      );
    }).join('');

    const coCurricular = [['Sports & Physical Ed.','B'],['Arts & Crafts','A'],['Music / Drama','B+'],['Community Service','A']];
    const behavioral   = [['Discipline','Excellent'],['Punctuality','Good'],['Participation','Very Good'],['Team Spirit','Excellent']];
    const gradingScale = [['A+','90-100'],['A','80-89'],['B+','70-79'],['B','60-69'],['C','50-59'],['D','33-49'],['F','Below 33']];
    const gc = gradeColor(overallGrade);
    const profileFields = [
      ['Student Name', stu.name], ['Admission No.', stu.admNo], ['Roll Number', stu.roll || '—'],
      ['Class / Section', className], ['Exam Period', (selExam.start_date||'') + ' to ' + (selExam.end_date||'')], ['Academic Year','2025 – 26']
    ];

    return (
      '<div style="width:190mm;min-height:277mm;padding:12mm 14mm;page-break-after:always;display:flex;flex-direction:column;gap:7px;font-family:Segoe UI,Arial,sans-serif;font-size:11px;color:#111827;box-sizing:border-box">' +

      // HEADER
      '<div style="display:flex;align-items:center;gap:14px;padding-bottom:10px;border-bottom:3px solid #1E1B4B">' +
        '<div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,#1E1B4B,#7C3AED);color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;flex-shrink:0">' + (school.schoolName||'S')[0] + '</div>' +
        '<div style="flex:1;text-align:center">' +
          '<div style="font-size:20px;font-weight:800;color:#1E1B4B">' + (school.schoolName||'School Name') + '</div>' +
          (school.tagline ? '<div style="font-size:11px;color:#6B7280;font-style:italic;margin-top:2px">' + school.tagline + '</div>' : '') +
          '<div style="font-size:9px;color:#374151;margin-top:5px;display:flex;justify-content:center;gap:14px;flex-wrap:wrap">' +
          (school.address ? '<span>&#128205; ' + school.address + '</span>' : '') +
          (school.phone   ? '<span>&#128222; ' + school.phone + '</span>' : '') +
          (school.email   ? '<span>&#9993; ' + school.email + '</span>' : '') +
          '</div></div>' +
        '<div style="text-align:right;font-size:9px;color:#6B7280;line-height:1.8">' +
          (school.affiliation ? '<div>Affil. No.<br><strong style="color:#1E1B4B">' + school.affiliation + '</strong></div>' : '') +
          (school.estYear     ? '<div style="margin-top:4px">Est.<br><strong style="color:#1E1B4B">' + school.estYear + '</strong></div>' : '') +
        '</div>' +
      '</div>' +

      // REPORT TITLE
      '<div style="display:flex;justify-content:space-between;align-items:center;background:#1E1B4B;color:#fff;padding:7px 14px;border-radius:7px">' +
        '<span style="font-size:12px;font-weight:800;letter-spacing:.08em">ACADEMIC PROGRESS REPORT</span>' +
        '<span style="font-size:10px;background:rgba(255,255,255,.18);padding:3px 12px;border-radius:20px">' + selExam.name + '</span>' +
      '</div>' +

      // STUDENT PROFILE
      '<div style="display:flex;gap:12px;align-items:center;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:12px">' +
        photoHtml +
        '<div style="flex:1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px 18px">' +
          profileFields.map(([l,v]) =>
            '<div><div style="font-size:9px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em">' + l + '</div>' +
            '<div style="font-size:12px;font-weight:700;color:#111827;margin-top:1px">' + v + '</div></div>'
          ).join('') +
        '</div>' +
        '<div style="padding:12px 16px;border-radius:10px;text-align:center;min-width:80px;background:' + (passed ? 'linear-gradient(135deg,#D1FAE5,#A7F3D0)' : 'linear-gradient(135deg,#FEE2E2,#FECACA)') + ';border:2px solid ' + (passed ? '#10B981' : '#EF4444') + '">' +
          '<div style="font-size:26px;font-weight:800;color:#1E1B4B">' + overallGrade + '</div>' +
          '<div style="font-size:13px;font-weight:700;color:#374151">' + pct + '%</div>' +
          '<div style="font-size:12px;font-weight:800;color:' + (passed ? '#065F46' : '#991B1B') + ';margin-top:2px">' + (passed ? 'PASS' : 'FAIL') + '</div>' +
        '</div>' +
      '</div>' +

      // MARKS TABLE TITLE
      '<div style="font-size:11px;font-weight:800;color:#1E1B4B;padding:4px 0 3px;border-bottom:2px solid #EDE9F8;letter-spacing:.03em">&#128202; Subject-wise Academic Performance</div>' +
      '<table style="width:100%;border-collapse:collapse;font-size:10px">' +
        '<thead><tr style="background:#1E1B4B;color:#fff">' +
          '<th style="padding:7px 8px;width:28px">#</th>' +
          '<th style="padding:7px 8px;text-align:left">Subject</th>' +
          '<th style="padding:7px 8px;text-align:center">Max</th>' +
          '<th style="padding:7px 8px;text-align:center">Pass</th>' +
          '<th style="padding:7px 8px;text-align:center">Obtained</th>' +
          '<th style="padding:7px 8px;text-align:center">Grade</th>' +
          '<th style="padding:7px 8px;text-align:center;width:110px">Performance</th>' +
        '</tr></thead>' +
        '<tbody>' + subjectRows + '</tbody>' +
        '<tfoot><tr style="background:#EDE9F8;border-top:2px solid #1E1B4B">' +
          '<td colspan="2" style="padding:7px 8px;font-weight:800;font-size:11px">GRAND TOTAL</td>' +
          '<td style="padding:7px 8px;text-align:center;font-weight:800">' + totalMax + '</td>' +
          '<td style="padding:7px 8px;text-align:center">—</td>' +
          '<td style="padding:7px 8px;text-align:center;font-weight:800;color:' + (passed?'#065F46':'#991B1B') + '">' + totalObtained + '</td>' +
          '<td style="padding:7px 8px;text-align:center"><span style="background:' + gc + '18;color:' + gc + ';border:1px solid ' + gc + '40;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:800">' + overallGrade + '</span></td>' +
          '<td style="padding:7px 8px;text-align:center;font-weight:800;color:' + (passed?'#065F46':'#991B1B') + '">' + pct + '% — ' + (passed?'PASS':'FAIL') + '</td>' +
        '</tr></tfoot>' +
      '</table>' +

      // CO-CURRICULAR + BEHAVIORAL
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        '<div style="border:1px solid #E5E7EB;border-radius:8px;padding:8px 10px">' +
          '<div style="font-size:10px;font-weight:800;color:#1E1B4B;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #EDE9F8">&#127912; Co-Curricular Activities</div>' +
          '<table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr style="background:#F9FAFB"><th style="padding:5px 8px;font-size:9px;color:#6B7280;text-align:left">Activity</th><th style="padding:5px 8px;font-size:9px;color:#6B7280;text-align:center">Grade</th></tr></thead><tbody>' +
          coCurricular.map(([a,g]) => '<tr><td style="padding:5px 8px;border-bottom:1px solid #F3F4F6">' + a + '</td><td style="padding:5px 8px;border-bottom:1px solid #F3F4F6;text-align:center"><span style="background:#EDE9F8;color:#5B21B6;border:1px solid #C4B5FD;padding:2px 8px;border-radius:20px;font-size:9px;font-weight:800">' + g + '</span></td></tr>').join('') +
          '</tbody></table></div>' +
        '<div style="border:1px solid #E5E7EB;border-radius:8px;padding:8px 10px">' +
          '<div style="font-size:10px;font-weight:800;color:#1E1B4B;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #EDE9F8">&#11088; Behavioral Evaluation</div>' +
          '<table style="width:100%;border-collapse:collapse;font-size:10px"><thead><tr style="background:#F9FAFB"><th style="padding:5px 8px;font-size:9px;color:#6B7280;text-align:left">Attribute</th><th style="padding:5px 8px;font-size:9px;color:#6B7280;text-align:center">Rating</th></tr></thead><tbody>' +
          behavioral.map(([b,r]) => '<tr><td style="padding:5px 8px;border-bottom:1px solid #F3F4F6">' + b + '</td><td style="padding:5px 8px;border-bottom:1px solid #F3F4F6;text-align:center;font-size:10px;font-weight:700;color:#065F46">' + r + '</td></tr>').join('') +
          '</tbody></table></div>' +
      '</div>' +

      // ATTENDANCE
      '<div style="border:1px solid #E5E7EB;border-radius:8px;padding:8px 12px">' +
        '<div style="font-size:10px;font-weight:800;color:#1E1B4B;margin-bottom:6px">&#128197; Attendance Record</div>' +
        '<div style="display:flex;align-items:center;gap:16px">' +
          [['Total Days','—','#1E1B4B'],['Present','—','#065F46'],['Absent','—','#DC2626'],['Late','—','#92400E']].map(([l,v,c]) =>
            '<div style="text-align:center"><div style="font-size:16px;font-weight:800;color:' + c + '">' + v + '</div><div style="font-size:9px;color:#6B7280;text-transform:uppercase">' + l + '</div></div>'
          ).join('') +
          '<div style="flex:1;margin:0 8px"><div style="height:8px;background:#F3F4F6;border-radius:5px;overflow:hidden"><div style="height:100%;width:85%;background:linear-gradient(90deg,#1E1B4B,#7C3AED);border-radius:5px"></div></div><div style="font-size:9px;color:#6B7280;margin-top:3px;text-align:center">Attendance %</div></div>' +
          '<div style="font-size:18px;font-weight:800;color:#065F46">—%</div>' +
        '</div>' +
      '</div>' +

      // REMARKS
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">' +
        '<div style="border:1px solid #E5E7EB;border-radius:8px;padding:8px 10px">' +
          '<div style="font-size:10px;font-weight:800;color:#1E1B4B;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #EDE9F8">&#128172; Class Teacher\'s Remarks</div>' +
          '<div style="font-size:11px;color:#D1D5DB;line-height:2.4">___________________________________<br/>___________________________________</div>' +
        '</div>' +
        '<div style="border:1px solid #E5E7EB;border-radius:8px;padding:8px 10px">' +
          '<div style="font-size:10px;font-weight:800;color:#1E1B4B;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid #EDE9F8">&#127979; Principal\'s Remarks</div>' +
          '<div style="font-size:11px;color:#D1D5DB;line-height:2.4">___________________________________<br/>___________________________________</div>' +
        '</div>' +
      '</div>' +

      // GRADING LEGEND
      '<div style="display:flex;align-items:center;gap:6px;background:#F9FAFB;border:1px solid #E5E7EB;border-radius:7px;padding:6px 10px;flex-wrap:wrap">' +
        '<span style="font-size:9px;font-weight:800;color:#374151;text-transform:uppercase;margin-right:4px">Grading Scale:</span>' +
        gradingScale.map(([g,r]) => '<span style="font-size:9px;color:#6B7280;padding:2px 8px;background:#fff;border:1px solid #E5E7EB;border-radius:20px"><strong style="color:#1E1B4B">' + g + '</strong> ' + r + '%</span>').join('') +
      '</div>' +

      // SIGNATURES
      '<div style="display:flex;gap:10px;padding-top:8px;margin-top:auto">' +
        [['Class Teacher',''],['Exam Coordinator',''],['Parent / Guardian',''],['Principal', school.principal||'']].map(([name, sub]) =>
          '<div style="flex:1;text-align:center">' +
          '<div style="border-top:1.5px solid #374151;margin-top:44px;margin-bottom:5px"></div>' +
          '<div style="font-size:10px;font-weight:800;color:#111827">' + name + '</div>' +
          (sub ? '<div style="font-size:9px;color:#6B7280;margin-top:1px">' + sub + '</div>' : '') +
          '<div style="font-size:9px;color:#9CA3AF;margin-top:3px">Date: ____________</div>' +
          '</div>'
        ).join('') +
      '</div>' +

      // PAGE FOOTER
      '<div style="display:flex;justify-content:space-between;font-size:9px;color:#9CA3AF;border-top:1px solid #E5E7EB;padding-top:5px;margin-top:4px">' +
        '<span>' + (school.schoolName||'EduErpee School') + ' &bull; Academic Progress Report &bull; ' + selExam.name + '</span>' +
        '<span>Generated: ' + new Date().toLocaleDateString('en-IN') + ' &bull; Page ' + (idx + 1) + ' of ' + studentResults.length + '</span>' +
      '</div>' +
      '</div>'
    );
  }).join('');

  const win = window.open('', '_blank', 'width=1000,height=800');
  win.document.write('<!DOCTYPE html><html><head>' +
    '<meta charset="utf-8"/>' +
    '<title>Result Sheet - ' + selExam.name + '</title>' +
    '<style>*{margin:0;padding:0;box-sizing:border-box;}body{background:#e5e7eb;padding:20px;}' +
    '@media print{body{background:#fff;padding:0;}@page{size:A4;margin:0;}}</style>' +
    '</head><body>' + pages +
    '<script>window.onload=function(){setTimeout(function(){window.print();},800);};<\/script>' +
    '</body></html>');
  win.document.close();
}
