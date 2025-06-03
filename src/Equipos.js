import React, { useState, useEffect } from "react";

function Equipos() {
  const [equipos, setEquipos] = useState([]);
  const [formValues, setFormValues] = useState({
    nombre: "",
    tipo: "",
    ubicacion: "",
    estado: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deletingId, setDeletingId] = useState(null); // Nuevo estado para saber cuál se está eliminando

  const baseUrl = "https://apex.oracle.com/pls/apex/elrafas44/equipos/";

  useEffect(() => {
    fetchEquipos();
  }, []);

  const fetchEquipos = async () => {
    try {
      setLoading(true);
      const response = await fetch(baseUrl);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al cargar equipos");
      }

      setEquipos(data.items || []);
      setError(null);
    } catch (error) {
      setEquipos([]); // Asegura que la tabla se limpie si hay error
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validación
      if (
        !formValues.nombre ||
        !formValues.tipo ||
        !formValues.ubicacion ||
        !formValues.estado
      ) {
        throw new Error("Todos los campos son obligatorios");
      }

      // Crear FormData
      const formData = new FormData();
      formData.append("nombre", formValues.nombre);
      formData.append("tipo", formValues.tipo);
      formData.append("ubicacion", formValues.ubicacion);
      formData.append("estado", formValues.estado);

      // Enviar datos
      const response = await fetch(baseUrl, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Manejar errores específicos de ORDS
        if (response.status === 555) {
          throw new Error(data.message || "Error en el servidor ORDS (555)");
        }
        throw new Error(data.message || `Error ${response.status}`);
      }

      // Éxito
      setSuccess("Equipo registrado correctamente");
      setFormValues({ nombre: "", tipo: "", ubicacion: "", estado: "" });
      await fetchEquipos(); // Actualizar lista
    } catch (error) {
      setError(error.message);
      if (error.message.includes("555")) {
        setError(
          (prev) => `${prev} - Verifica la configuración del endpoint REST`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este equipo?")) return;

    try {
      setDeletingId(id);
      setError(null);
      setSuccess(null);

      // ORDS: POST con _method=DELETE y ?id=...
      const formData = new FormData();
      formData.append("_method", "DELETE");
      formData.append("id", id);

      const response = await fetch(`${baseUrl}?id=${id}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Error al eliminar equipo");
      }

      setSuccess("Equipo eliminado correctamente");
      // Elimina el equipo del estado antes de refrescar la lista
      setEquipos((prev) => prev.filter((e) => e.id !== id));
      await fetchEquipos(); // Refresca la lista para evitar filas en blanco
    } catch (error) {
      setError(error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Gestión de Equipos</h1>
      {/* Formulario */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>Registrar Nuevo Equipo</h2>
        <form onSubmit={handleSubmit}>
          {["nombre", "tipo", "ubicacion"].map((field) => (
            <div key={field} style={styles.formGroup}>
              <label style={styles.label}>
                {field.charAt(0).toUpperCase() + field.slice(1)}:
              </label>
              <input
                type="text"
                name={field}
                value={formValues[field]}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>
          ))}

          <div style={styles.formGroup}>
            <label style={styles.label}>Estado:</label>
            <select
              name="estado"
              value={formValues.estado}
              onChange={handleChange}
              required
              style={styles.input}
            >
              <option value="">Seleccionar...</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Mantenimiento">Mantenimiento</option>
            </select>
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Guardando..." : "Guardar Equipo"}
          </button>
        </form>
      </div>

      {/* Mensajes */}
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      {/* Lista */}
      <div style={styles.card}>
        <h2 style={styles.subtitle}>Equipos Registrados</h2>
        {loading && equipos.length === 0 ? (
          <p>Cargando...</p>
        ) : equipos.length === 0 ? (
          <p>No hay equipos registrados</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {["Nombre", "Tipo", "Ubicación", "Estado", "Eliminar"].map(
                  (header) => (
                    <th key={header} style={styles.th}>
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {equipos.map((equipo) => (
                <tr key={equipo.id} style={styles.tr}>
                  <td style={styles.td}>{equipo.nombre}</td>
                  <td style={styles.td}>{equipo.tipo}</td>
                  <td style={styles.td}>{equipo.ubicacion}</td>
                  <td style={styles.td}>{equipo.estado}</td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleDelete(equipo.id)}
                      disabled={!!deletingId}
                      style={styles.deleteButton}
                    >
                      {deletingId === equipo.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Estilos (puedes moverlos a un archivo CSS separado)
const styles = {
  container: {
    maxWidth: "900px",
    margin: "40px auto",
    padding: "30px",
    fontFamily: "Segoe UI, Arial, sans-serif",
    background: "linear-gradient(120deg, #89f7fe 0%, #66a6ff 100%)", // azul claro degradado
    borderRadius: "18px",
    boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)",
  },
  title: {
    color: "#2d3436",
    textAlign: "center",
    fontWeight: 700,
    fontSize: "2.5rem",
    letterSpacing: "2px",
    marginBottom: "30px",
  },
  card: {
    background: "rgba(255,255,255,0.95)",
    padding: "28px",
    borderRadius: "14px",
    marginBottom: "28px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  },
  subtitle: {
    marginTop: 0,
    color: "#636e72",
    fontWeight: 600,
    fontSize: "1.3rem",
  },
  formGroup: {
    marginBottom: "18px",
  },
  label: {
    display: "block",
    marginBottom: "6px",
    fontWeight: 600,
    color: "#636e72",
  },
  input: {
    width: "100%",
    padding: "10px",
    borderRadius: "7px",
    border: "1.5px solid #b2bec3",
    boxSizing: "border-box",
    fontSize: "1rem",
    background: "#f1f2f6",
    transition: "border 0.2s",
    outline: "none",
  },
  button: {
    background: "linear-gradient(90deg, #00b894 0%, #00cec9 100%)",
    color: "white",
    padding: "12px 0",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "1.1rem",
    fontWeight: 600,
    width: "100%",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    marginTop: "10px",
    transition: "background 0.2s",
  },
  error: {
    background: "#ffe5e5",
    color: "#d63031",
    padding: "12px",
    borderRadius: "7px",
    marginBottom: "20px",
    fontWeight: 600,
    border: "1.5px solid #fab1a0",
  },
  success: {
    background: "#dff9fb",
    color: "#00b894",
    padding: "12px",
    borderRadius: "7px",
    marginBottom: "20px",
    fontWeight: 600,
    border: "1.5px solid #55efc4",
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    marginTop: "18px",
    background: "rgba(255,255,255,0.98)",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  th: {
    background: "linear-gradient(90deg, #00b894 0%, #00cec9 100%)",
    color: "white",
    padding: "13px",
    textAlign: "left",
    fontWeight: 700,
    fontSize: "1rem",
    borderBottom: "2px solid #00b894",
  },
  tr: {
    background: "#f8f9fa",
  },
  td: {
    padding: "12px",
    fontSize: "1rem",
    color: "#2d3436",
    borderBottom: "1.5px solid #dfe6e9",
  },
  deleteButton: {
    background: "linear-gradient(90deg, #ff7675 0%, #fd79a8 100%)",
    color: "white",
    padding: "7px 16px",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "1rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    transition: "background 0.2s",
  },
};

export default Equipos;
