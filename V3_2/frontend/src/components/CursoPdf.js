import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Button, Form, Card, Container, Tabs, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import CursoFormato from './CursoFormato.js';
import html2pdf from 'html2pdf.js';
import axios from 'axios';
import { FaTrash, FaPlus } from 'react-icons/fa';

const CursoPdf = () => {
  const [curso, setCurso] = useState({
    nombre: '',
    codigo: '',
    semestre: '',
    totalHoras: '',
    descripcion: '',
    objetivos: '',
    temas: '',
    bibliografia: '',
    ID_program: '',
    school: '',
    methodology: '',
    major: '',
    study_mode: '',
    professors: '',
    weekly_class_schedule: '',
    weekly_tutoring_schedule: '',
    contribution: '',
    prerequisite_course: '',
    prerequisite_code: '',
    corequisite_course: '',
    corequisite_code: ''
  });

  const [programData, setProgramData] = useState([]);
  const [mostrarFormato, setMostrarFormato] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const printRef = useRef();
  const navigate = useNavigate();
  const [units, setUnits] = useState([
    {
      unit: '',
      contents: [
        {
          content: '',
          teaching_hours: '',
          internship_hours: '',
          independent_hours: '',
        }
      ],
      evaluation_instruments: ''
    }
  ]);

  // Verificar si el token existe
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/'); 
    }
  }, [navigate]);

  // Obtener los programas disponibles
  useEffect(() => {
    const fetchProgramData = async () => {
      try {
        const token = localStorage.getItem('token'); // Obtén el token del usuario
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/program/programs`, // Endpoint para obtener los programas
          {
            headers: {
              Authorization: `Bearer ${token}`, // Envía el token en los headers
            },
          }
        );
        setProgramData(response.data); // Guarda los programas en el estado
      } catch (error) {
        console.error('Error al obtener los programas:', error);
      }
    };

    fetchProgramData();
  }, []);

  // Auto completar los campos basados en el programa seleccionado
  useEffect(() => {
    if (curso.ID_program) {
      const selectedProgram = programData.find(
        (program) => program.ID_program === parseInt(curso.ID_program)
      );
      if (selectedProgram) {
        setCurso((prevCurso) => ({
          ...prevCurso,
          nombre: selectedProgram.curricular_unit,
          codigo: selectedProgram.code || selectedProgram.ID_program,
          semestre: selectedProgram.semester,
          descripcion: selectedProgram.content,
          totalHoras: selectedProgram.total_hours,
          school: selectedProgram.school,
          methodology: selectedProgram.methodology,
          major: selectedProgram.major,
          study_mode: selectedProgram.study_mode,
          professors: selectedProgram.professors,
          weekly_class_schedule: selectedProgram.weekly_class_schedule,
          weekly_tutoring_schedule: selectedProgram.weekly_tutoring_schedule,
          contribution: selectedProgram.contribution,
          prerequisite_course: selectedProgram.prerequisites
            ? JSON.parse(selectedProgram.prerequisites).map(p => p.course).join(', ')
            : '',
          prerequisite_code: selectedProgram.prerequisites
            ? JSON.parse(selectedProgram.prerequisites).map(p => p.code).join(', ')
            : '',
          corequisite_course: selectedProgram.corequisites
            ? JSON.parse(selectedProgram.corequisites).map(c => c.course).join(', ')
            : '',
          corequisite_code: selectedProgram.corequisites
            ? JSON.parse(selectedProgram.corequisites).map(c => c.code).join(', ')
            : '',
          objetivos: selectedProgram.objectives || '',
          temas: selectedProgram.temas || '',
          bibliografia: selectedProgram.bibliography || '',
          // Si tienes más campos, agrégalos aquí
        }));
      }
    }
  }, [curso.ID_program, programData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurso((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveToDatabase = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/Syllabus/create`,
        {
          ID_program: curso.ID_program,
          syllabus_name: curso.nombre,
          objetivos: curso.objetivos,
          temas: curso.temas,
          bibliografia: curso.bibliografia,
          prerequisite_course: curso.prerequisite_course,
          prerequisite_code: curso.prerequisite_code,
          corequisite_course: curso.corequisite_course,
          corequisite_code: curso.corequisite_code,
          units: JSON.stringify(units),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert(response.data.message);
      navigate('/dashboard'); // Redirige al dashboard después de guardar
    } catch (error) {
      console.error('Error al guardar en la base de datos:', error);
      alert('Error al guardar en la base de datos');
    }
  };

  const handlePreview = () => {
    setMostrarFormato(true);
  };

  const handleSave = () => {
    const options = {
      margin: 1,
      filename: `${curso.nombre}-curso.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 4 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    };

    html2pdf()
      .from(printRef.current)
      .set(options)
      .save();
  };

  const handleUnitChange = (idx, value) => {
    const updated = units.map((item, i) =>
      i === idx ? { ...item, unit: value } : item
    );
    setUnits(updated);
  };

  const handleContentChange = (unitIdx, contentIdx, field, value) => {
    const updated = units.map((item, i) =>
      i === unitIdx
        ? {
            ...item,
            contents: item.contents.map((c, j) =>
              j === contentIdx ? { ...c, [field]: value } : c
            ),
          }
        : item
    );
    setUnits(updated);
  };

  const addUnit = () =>
    setUnits([
      ...units,
      {
        unit: '',
        contents: [
          {
            content: '',
            teaching_hours: '',
            internship_hours: '',
            independent_hours: '',
          },
        ],
        evaluation_instruments: '',
      },
    ]);

  const removeUnit = (idx) => setUnits(units.filter((_, i) => i !== idx));

  const addContent = (unitIdx) => {
    const updated = units.map((item, i) =>
      i === unitIdx
        ? {
            ...item,
            contents: [
              ...item.contents,
              {
                content: '',
                teaching_hours: '',
                internship_hours: '',
                independent_hours: '',
              },
            ],
          }
        : item
    );
    setUnits(updated);
  };

  const removeContent = (unitIdx, contentIdx) => {
    const updated = units.map((item, i) =>
      i === unitIdx
        ? {
            ...item,
            contents: item.contents.filter((_, j) => j !== contentIdx),
          }
        : item
    );
    setUnits(updated);
  };

  const handleEvaluationChange = (unitIdx, value) => {
    const updated = units.map((item, i) =>
      i === unitIdx ? { ...item, evaluation_instruments: value } : item
    );
    setUnits(updated);
  };

  return (
    <Container className="mt-5">
      <h1 className="text-center mb-4">Formulario de Curso</h1>
      <Card className="mb-4">
        <Card.Body>
          <Tabs
            id="curso-tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-3"
            justify
          >
            <Tab eventKey="general" title="1. General Information">
              <Form.Group className="mb-3">
                <Form.Label>Seleccionar Programa</Form.Label>
                <Form.Control
                  as="select"
                  name="ID_program"
                  value={curso.ID_program}
                  onChange={handleChange}
                >
                  <option value="">Seleccione un programa</option>
                  {programData.map((program) => (
                    <option key={program.ID_program} value={program.ID_program}>
                      {program.curricular_unit}
                    </option>
                  ))}
                </Form.Control>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Escuela</Form.Label>
                <Form.Control
                  type="text"
                  name="school"
                  value={curso.school}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Carrera/Mención</Form.Label>
                <Form.Control
                  type="text"
                  name="major"
                  value={curso.major || ''}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Nombre del Curso</Form.Label>
                <Form.Control
                  type="text"
                  name="nombre"
                  value={curso.nombre}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Código</Form.Label>
                <Form.Control
                  type="text"
                  name="codigo"
                  value={curso.codigo}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Semestre</Form.Label>
                <Form.Control
                  type="text"
                  name="semestre"
                  value={curso.semestre}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Modalidad de Estudio</Form.Label>
                <Form.Control
                  type="text"
                  name="study_mode"
                  value={curso.study_mode || ''}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Total de Horas</Form.Label>
                <Form.Control
                  type="text"
                  name="totalHoras"
                  value={curso.totalHoras}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Profesores</Form.Label>
                <Form.Control
                  type="text"
                  name="professors"
                  value={curso.professors || ''}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Horario de Clases</Form.Label>
                <Form.Control
                  type="text"
                  name="weekly_class_schedule"
                  value={curso.weekly_class_schedule || ''}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Horario de Tutoría</Form.Label>
                <Form.Control
                  type="text"
                  name="weekly_tutoring_schedule"
                  value={curso.weekly_tutoring_schedule || ''}
                  onChange={handleChange}
                />
              </Form.Group>
            </Tab>
            <Tab eventKey="prereq" title="2. Prerequisites and Corequisites">
              <Form.Group className="mb-3">
                <Form.Label>Course: Prerequisitos</Form.Label>
                <Form.Control
                  type="text"
                  name="prerequisite_course"
                  value={curso.prerequisite_course}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Código Prerrequisito</Form.Label>
                <Form.Control
                  type="text"
                  name="prerequisite_code"
                  value={curso.prerequisite_code}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Course: Correquisitos</Form.Label>
                <Form.Control
                  type="text"
                  name="corequisite_course"
                  value={curso.corequisite_course}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Código Correquisito</Form.Label>
                <Form.Control
                  type="text"
                  name="corequisite_code"
                  value={curso.corequisite_code}
                  onChange={handleChange}
                />
              </Form.Group>
            </Tab>
            <Tab eventKey="description" title="3. Course Description">
              <Form.Group className="mb-3">
                <Form.Label>Descripción del Curso</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="descripcion"
                  value={curso.descripcion}
                  onChange={handleChange}
                />
              </Form.Group>
            </Tab>
            <Tab eventKey="contribution" title="4. Course Contribution">
              <Form.Group className="mb-3">
                <Form.Label>Aporte Profesional</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="contribution"
                  value={curso.contribution || ''}
                  onChange={handleChange}
                />
              </Form.Group>
            </Tab>
            <Tab eventKey="objectives" title="5. Course Objectives">
              <Form.Group className="mb-3">
                <Form.Label>Objetivos del Curso</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="objetivos"
                  value={curso.objetivos}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Temas</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="temas"
                  value={curso.temas}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Bibliografía</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="bibliografia"
                  value={curso.bibliografia}
                  onChange={handleChange}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Metodología</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="methodology"
                  value={curso.methodology}
                  onChange={handleChange}
                />
              </Form.Group>
            </Tab>
            <Tab eventKey="units" title="6. Units / Contents / Hours / Evaluation Instruments">
              {units.map((unit, unitIdx) => (
                <Card key={unitIdx} className="mb-3">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-2">
                      <Form.Control
                        type="text"
                        placeholder={`Unidad Curricular (ej: CU ${unitIdx + 1})`}
                        value={unit.unit}
                        onChange={e => handleUnitChange(unitIdx, e.target.value)}
                        className="me-2"
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => removeUnit(unitIdx)}
                        disabled={units.length === 1}
                      >
                        <FaTrash />
                      </Button>
                    </div>
                    <h6>Contenidos y Horas</h6>
                    {unit.contents.map((content, contentIdx) => (
                      <div key={contentIdx} className="d-flex align-items-center mb-2 flex-wrap">
                        <Form.Control
                          type="text"
                          placeholder={`Contenido ${contentIdx + 1}`}
                          value={content.content}
                          onChange={e => handleContentChange(unitIdx, contentIdx, 'content', e.target.value)}
                          className="me-2 mb-2"
                          style={{ minWidth: 200 }}
                        />
                        <Form.Control
                          type="number"
                          placeholder="Teaching Hours"
                          value={content.teaching_hours}
                          onChange={e => handleContentChange(unitIdx, contentIdx, 'teaching_hours', e.target.value)}
                          className="me-2 mb-2"
                          style={{ width: 120 }}
                        />
                        <Form.Control
                          type="number"
                          placeholder="Internship Hours"
                          value={content.internship_hours}
                          onChange={e => handleContentChange(unitIdx, contentIdx, 'internship_hours', e.target.value)}
                          className="me-2 mb-2"
                          style={{ width: 120 }}
                        />
                        <Form.Control
                          type="number"
                          placeholder="Independent Hours"
                          value={content.independent_hours}
                          onChange={e => handleContentChange(unitIdx, contentIdx, 'independent_hours', e.target.value)}
                          className="me-2 mb-2"
                          style={{ width: 120 }}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => removeContent(unitIdx, contentIdx)}
                          disabled={unit.contents.length === 1}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => addContent(unitIdx)}
                      className="mb-2"
                    >
                      <FaPlus /> Agregar Contenido
                    </Button>
                    <Form.Group className="mt-3">
                      <Form.Label>Instrumentos de Evaluación</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Ej: Workshops, Project 1"
                        value={unit.evaluation_instruments}
                        onChange={e => handleEvaluationChange(unitIdx, e.target.value)}
                      />
                    </Form.Group>
                  </Card.Body>
                </Card>
              ))}
              <Button variant="primary" size="sm" onClick={addUnit}>
                <FaPlus /> Agregar Unidad
              </Button>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      <div className="text-center mb-5">
        <Button variant="primary" onClick={handlePreview} className="me-2">
          Generar Syllabus
        </Button>
        <Button variant="primary" onClick={() => navigate('/dashboard')}>
          Regresar al Dashboard
        </Button>
        {mostrarFormato && (
          <div>
            <Button variant="success" onClick={handleSave}>
              Generar a formato PDF
            </Button>
            <Button variant="info" onClick={handleSaveToDatabase}>
              Guardar en la Base de Datos
            </Button>
          </div>
        )}
      </div>

      {mostrarFormato && (
        <div ref={printRef} style={{ backgroundColor: "white", padding: "20px", marginBottom: "40px" }}>
          <CursoFormato curso={curso} />
        </div>
      )}
    </Container>
  );
};

export default CursoPdf;
