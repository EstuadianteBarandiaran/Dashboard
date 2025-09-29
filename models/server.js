require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');
const ejs=require('ejs')
const bcrypt=require('bcrypt')
const mysql = require('mysql2/promise');
const mongoose=require('mongoose')
const Session = require('express-session');
const nodemailer = require('nodemailer');
const cors = require('cors');
const pdf = require('html-pdf');
const bodyParser = require('body-parser');

console.log('Ruta completa del logo:', path.join(__dirname, '.', 'public', 'img', 'logo1.jpg'));


const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 's.a.m',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
//comentario
class Server {
    constructor() {
        this.app = express();
        this.app.use(cors());
        this.port = process.env.NODE_ENV === 'test'? process.env.TEST_PORT || 5001 : process.env.PORT || 5000;

        this.url = process.env.MONGO_URL;
        this.host=process.env.DB_HOST;
        this.user= process.env.DB_USER;
        this.password= process.env.DB_PASSWORD;
        this.database= process.env.DB_NAME;
        this.middlewares();
        this.routes();
        this.listen();
        this.conectarMongo();
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'laura.aguilaromero@gmail.com', 
                pass: process.env.EMAIL_PASS 
            }
        });
    }

    async conectarMongo(forceReconnect = false) {
  if (!forceReconnect && mongoose.connection.readyState === 1) {
    console.log('Reutilizando conexión MongoDB existente');
    this.definirModelos();
    return;
  }

  const connectionUrl = this.url;
  if (!connectionUrl) {
    console.error('MONGO_URL no está definida');
    return;
  }

  try {
    await mongoose.connect(connectionUrl);
    console.log('Conectado a MongoDB exitosamente');
    this.definirModelos();

    mongoose.connection.on('error', (err) => {
      console.error('Error de conexión a MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Desconectado de MongoDB');
    });
  } catch (error) {
    console.error('Error en conectarMongo:', error);
    throw error;
  }
}



definirModelos() {
    // Solo definir modelos si no existen
    if (this.ModelUsuarios) {
        return;
    }

    let Schema = mongoose.Schema;

    const Usuario = new Schema({
        id: Number,
        correo: String,
        Password: String,
        Nombres: String,
        Apellido: String,
        Genero: String,
        fecha_nacimiento: String,
        id_Rol: String
    });

    const Consulta = new Schema({
        id: Number,
        Motivo: String,
        Sintomas: String,
        Alergias: String,
        CirugiasPrevias: String,
        HospitalizacionesPrevias: String,
        ConsumoTabaco: String,
        ConsumoAlcohol: String,
        Direccion: String,
        IdEstado: Number,
        IdResultado: Number
    });
    
    const Receta = new Schema({
        id: Number,
        Diagnostico: String,
        Tratamiento: String,
        Fecha: String
    });

    const HistorialClinico = new Schema({
        id: Number,
        idConsulta: Number,
        idReceta: Number,
        idPaciente: Number,
        idMedico: Number
    });

    const Sugerencia = new Schema({
        Motivo: String,
        Descripcion: String,
    });

    try {
        this.ModelUsuarios = mongoose.model('users', Usuario);
        this.ModelConsultas = mongoose.model('consultas', Consulta);
        this.ModelRecetas = mongoose.model('Recetas', Receta);
        this.ModelHistorialClinico = mongoose.model('HistorialClinicos', HistorialClinico);
        this.ModelSugerencia = mongoose.model('sugerencias', Sugerencia);
        console.log('Modelos de MongoDB definidos');
    } catch (error) {
        if (error.name === 'OverwriteModelError') {
            // Obtener modelos existentes
            this.ModelUsuarios = mongoose.model('users');
            this.ModelConsultas = mongoose.model('consultas');
            this.ModelRecetas = mongoose.model('Recetas');
            this.ModelHistorialClinico = mongoose.model('HistorialClinicos');
            this.ModelSugerencia = mongoose.model('sugerencias');
            console.log('Modelos de MongoDB obtenidos de caché');
        } else {
            throw error;
        }
    }
}
    async obtenerUltimoRegistro(nombreColeccion) {
        try {
            const coleccion = mongoose.connection.collection(nombreColeccion); 
            let ultimoRegistro = await coleccion.findOne({}, { sort: { id: -1 } });
    
            if (ultimoRegistro) {
                const ultimoId = ultimoRegistro.id;  
                return ultimoId + 1;  
            } else {
                return 1;
            }
        } catch (error) {
            console.error("Error al obtener el último registro:", error);
            return null;  // Retorna null en caso de error
        }
    }
    async probarConexion() {
        try {
            // Obtener una conexión del pool
            const conn = await pool.getConnection();
            conn.release();
            return true;
        } catch (error) {
            // Si ocurre un error, lo capturamos
            console.error("Error de conexión:", error);
            return false;
        }
    }


    
    
    middlewares() {
        this.app.use(express.static('./public'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.set('view engine', 'ejs');
        this.app.use(Session({
            secret: 'clave',
            resave: false,
            saveUninitialized: true,
            cookie: { secure: false }  
        }));
        
    }

    routes() {
        //RUTAS GENERALES DE ARCHIVOS

        //Ruta de index o inicio
        this.app.get("/",(req,res)=>{
            res.render("login");
        })

        this.app.post("/login", async (req, res) => {
            try {
                // 1. Extraer datos (como en la primera versión)
                const { email, password } = req.body;
                let user = null;
        
                // 2. Verificar conexión (como en ambas versiones)
                const conexionExitosa = await this.probarConexion();
                console.log("Conexión exitosa:", conexionExitosa);
        
                // 3. Buscar usuario (optimizado)
                if (conexionExitosa) {
                    const [rows] = await pool.query("SELECT * FROM users WHERE Correo = ?", [email]);
                    user = rows[0] || null; // Más conciso que rows.length > 0
                } else {
                    user = await this.ModelUsuarios.findOne({ correo: email }); // Usar findOne como primera versión
                }
        
                // 4. Validar usuario
                if (!user) {
                    console.log("Error: Usuario no encontrado");
                    return res.status(400).json({ error: "Usuario no encontrado" }); // Mejor respuesta JSON
                }
        
                // 5. Validar contraseña
                const isMatch = await bcrypt.compare(password, user.Password);
                if (!isMatch) {
                    console.log("Error: Contraseña incorrecta");
                    return res.status(400).json({ error: "Contraseña incorrecta" });
                }
        
                // 6. Configurar sesión (como en ambas versiones)
                req.session.nombre = user.Nombres;
                console.log("Nombre guardado en sesión:", req.session.nombre);
                req.session.rol = user.id_Rol;
                req.session.Userid = user.idUsers;
        
                console.log(`Usuario ${user.Nombres} autenticado con rol ${user.id_Rol}`);
        
                // 7. Redirección (combinando claridad de ambas)
                const redirectPaths = {
                    1: "/indexMedicoControl",
                    2: "/indexMedico", 
                    3: "/indexPaciente"
                };
        
                const path = redirectPaths[user.id_Rol];
                if (path) {
                    return res.redirect(path);
                }
                
                console.log("Error: Rol desconocido");
                return res.status(500).json({ error: "Error en el login" });

        
            } catch (error) {
                console.error("Error en el login:", error);
                return res.status(500).json({ error: "Error interno del servidor" });
            }
        });
        //Cerrar SESION 
        this.app.get('/CerrarSesion', (req, res) => {
            req.session.destroy(err => {
                if (err) {
                    console.error("Error al cerrar sesión", err);
                    res.status(500).send("Error al cerrar sesión");
                } else {
                    res.redirect('/');
                }
            });
        });
        

        //funcion grafica
        this.app.get('/api/users', async (req, res) => {
        try {
            const [rows] = await pool.query("SELECT * FROM users WHERE id_Rol != 1");
            res.json(rows); // Ahora sí devuelve la respuesta
        } catch (error) {
        res.status(500).json({ message: 'Error obteniendo datos', error });
        }
        });
        this.app.get('/api/consultas', async (req, res) => {
            try {
                console.log("Ruta /api/consultas fue llamada");
                const [rows] = await pool.query("SELECT * FROM consultas WHERE idEstado IS NOT NULL");
                console.log("Datos obtenidos:", rows);
                res.json(rows);
            } catch (error) {
                console.error("Error en la consulta:", error);
                res.status(500).json({ message: 'Error obteniendo datos', error });
            }
        });
        

        this.app.get('/api/recetasPorMes', async (req, res) => {
            try {
                const [rows] = await pool.query(`
                    SELECT DATE_FORMAT(recetas.fecha, '%Y-%m') AS mes, COUNT(*) AS cantidad
                    FROM recetas
                    GROUP BY mes
                    ORDER BY mes ASC;

                `);
                res.json(rows);
            } catch (error) {
                res.status(500).json({ message: "Error al obtener recetas por mes", error });
            }
        });
        
        this.app.get('/api/resultado', async (req, res) => {
            try {
                const [rows] = await pool.query("SELECT * FROM consultas WHERE idResultado IS NOT NULL");
                res.json(rows); // Ahora sí devuelve la respuesta
            } catch (error) {
                res.status(500).json({ message: "Error al obtener resultados", error });
            }
        });
        // Renderizar la vista donde irá la gráfica
        this.app.get('/dashboard', (req, res) => {
        res.render('MedicoControl/indexControl'); // Asegúrate de que el archivo existe
        });

        //RUTAS DE MEDICO DE CONTROL

        //Index de medico de control

        //25 marzo
        this.app.get('/api/users', async (req, res) => {
            try {
                const role = req.query.role;
                let query = "SELECT idUsers, Nombres, Apellido, Correo, fecha_nacimiento, Genero, id_Rol FROM users";
                
                if (role) {
                    query += " WHERE id_Rol = ?";
                    const [users] = await pool.query(query, [role]);
                    res.json(users);
                } else {
                    const [users] = await pool.query(query);
                    res.json(users);
                }
            } catch (error) {
                console.error("Error al obtener usuarios:", error);
                res.status(500).json({ success: false, message: "Error al Obtener usuarios" });
            }
        });
        
        // Obtener un usuario específico
        this.app.get('/api/users/:id', async (req, res) => {
            try {
                const [user] = await pool.query(
                    "SELECT idUsers, Nombres, Apellido, Correo, fecha_nacimiento, Genero, id_Rol FROM users WHERE idUsers = ?", 
                    [req.params.id]
                );
                
                if (user.length === 0) {
                    return res.status(404).json({ success: false, message: "Usuario no encontrado" });
                }
                
                res.json(user[0]);
            } catch (error) {
                console.error("Error al obtener usuario:", error);
                res.status(500).json({ success: false, message: "Error al obtener usuario" });
            }
        });
        
        // Actualizar usuario
        this.app.put('/api/users/:id', async (req, res) => {
            try {
                const { Nombres, Apellido, Correo, fecha_nacimiento, Genero } = req.body;
                
                const [result] = await pool.query(
                    "UPDATE users SET Nombres = ?, Apellido = ?, Correo = ?, fecha_nacimiento = ?, Genero = ? WHERE idUsers = ?",
                    [Nombres, Apellido, Correo, fecha_nacimiento, Genero, req.params.id]
                );
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: "Usuario no encontrado" });
                }
                
                res.json({ success: true });
            } catch (error) {
                console.error("Error al actualizar usuario:", error);
                res.status(500).json({ success: false, message: "Error al actualizar usuario" });
            }
        });
        
        // Eliminar usuario
        this.app.delete('/api/users/:id', async (req, res) => {
            try {
                const [result] = await pool.query("DELETE FROM users WHERE idUsers = ?", [req.params.id]);
                
                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: "Usuario no encontrado" });
                }
                
                res.json({ success: true });
            } catch (error) {
                console.error("Error al eliminar usuario:", error);
                res.status(500).json({ success: false, message: "Error al eliminar usuario" });
            }
        });
        //25 marzo
        
        //26
        this.app.post('/generate-pdf', async (req, res) => {
            try {
                const { diagnostico, tratamiento, pacienteInfo } = req.body;
        
                // Obtener información del doctor
                const [doctor] = await pool.query(
                    "SELECT Nombres, Apellido FROM users WHERE idUsers = ?", 
                    [req.session.Userid]
                );
        
                const doctorNombre = doctor.length > 0 
                    ? `${doctor[0].Nombres} ${doctor[0].Apellido}`
                    : "Nombre del Médico";
        
                const logo1Path = path.join(__dirname, '..', 'public', 'img', 'logo1.jpg'); 
                const logo1Base64 = fs.existsSync(logo1Path) 
                    ? fs.readFileSync(logo1Path, 'base64') 
                    : null;
        
                // Ruta de la plantilla EJS
                const filePath = path.join(__dirname, '../views/pdf/receta.ejs');
        
                // Verificar si la plantilla existe antes de renderizarla
                if (!fs.existsSync(filePath)) {
                    console.error('El archivo receta.ejs no existe en la ruta:', filePath);
                    return res.status(500).json({ error: 'Plantilla no encontrada' });
                }
        
                // Preparar los datos para la plantilla EJS
                const data = {
                    // ... (datos existentes) ...
                    observaciones: diagnostico,  
                    medicamento: tratamiento,  
                    dosis: "Según indicaciones médicas",
                    doctor: { nombre: doctorNombre },
                    clinica: {
                        direccion: "Av. Principal #123, Ciudad, Estado",
                        telefono: "555-123-4567"
                    },
                    fecha: new Date().toLocaleDateString('es-MX', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    }),
                    paciente: { 
                        nombre: pacienteInfo.nombre,
                        motivo: pacienteInfo.motivo, 
                        sintomas: pacienteInfo.sintomas 
                    },
                    diagnostico: diagnostico, 
                    tratamiento: tratamiento,
                    logo: logo1Base64 ? `data:image/jpeg;base64,${logo1Base64}` : null // Si no hay logo, asignar null
                };
        
                // Renderizar la plantilla EJS
                ejs.renderFile(filePath, data, (err, html) => {
                    if (err) {
                        console.error('Error al renderizar plantilla:', err);
                        return res.status(500).json({ error: 'Error al generar PDF' });
                    }
        
                    // Opciones para media carta horizontal
                    const options = {
                        timeout: 30000
                    };
        
                    pdf.create(html, options).toBuffer((err, buffer) => {
                        if (err) {
                            console.error('Error al generar PDF:', err);
                            return res.status(500).json({ error: 'Error al generar PDF' });
                        }
        
                        res.setHeader('Content-Type', 'application/pdf');
                        res.setHeader('Content-Disposition', `attachment; filename=receta_${Date.now()}.pdf`);
                        res.send(buffer);
                    });
                });
            } catch (error) {
                console.error('Error en generate-pdf:', error);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        });
        
        
        //26

        //MEDICO DE CONTROl
        this.app.get('/indexMedicoControl', (req, res) => {
            if (!req.session.nombre) {
                return res.redirect('/login'); // Redirige a login si no hay sesión
            }
            
            if (req.session.rol === 1) {
                return res.render('MedicoControl/indexControl.ejs', { nombre: req.session.nombre });
            } else {
                return res.redirect('/CerrarSesion'); // Desconectar si el rol no es válido
            }
        });
        

        //Index de Crud de usuarios
        this.app.get('/CRUDUsuarios', (req, res) => {
            if (req.session.rol==1) {
            res.render('MedicoControl/CRUDUsuarios.ejs');
            }else{
                res.redirect('/CerrarSesion')
            }
        });

        //Index de las consultas de eleccion a paciente o doctor
        this.app.get('/ControlConsulta', async(req, res) => {
            if (req.session.rol==1) {
                const [ConsultaPacientes] = await pool.query("SELECT historialclinico.idHistorialClinico AS idHistorialClinico,historialclinico.idConsulta AS idConsulta,historialclinico.idPaciente AS idPaciente,consultas.Motivo AS Motivo,consultas.Sintomas AS Sintomas,users.Nombres AS Nombre,users.Apellido AS Apellido FROM historialclinico LEFT JOIN consultas ON historialclinico.idConsulta = consultas.idConsultas LEFT JOIN users ON historialclinico.idPaciente = users.idUsers WHERE consultas.idEstado = 1");
                const [ConsultaReceta] = await pool.query("SELECT historialclinico.idHistorialClinico AS idHistorialClinico,historialclinico.idConsulta AS idConsulta,historialclinico.idReceta AS idReceta,consultas.Motivo AS Motivo,consultas.Sintomas AS Sintomas,recetas.Diagnostico AS Diagnostico,recetas.Tratamiento AS Tratamiento,users.Nombres AS Nombre,users.Apellido AS Apellido FROM historialclinico LEFT JOIN consultas ON historialclinico.idConsulta = consultas.idConsultas LEFT JOIN recetas ON historialclinico.idReceta = recetas.idRecetas LEFT JOIN users ON historialclinico.idPaciente = users.idUsers WHERE consultas.idEstado = 3");
                const [Doctores] = await pool.query("SELECT idUsers, Nombres, Apellido, Correo FROM users WHERE id_Rol = 2");
               
                res.render('MedicoControl/ControlConsulta.ejs',{ConsultaPaciente:ConsultaPacientes,Doctor:Doctores,ConsultaReceta:ConsultaReceta});
            }else{
                res.redirect('/CerrarSesion')
            }
        });

        //Ruta Consulta de registros de quejas sugerencias
        this.app.get('/ContactoControl', (req, res) => {
            res.render('MedicoControl/Contacto.ejs');
        });

       //Ruta Registro de uuarios ruta
        this.app.get('/Registro', async(req, res) => {
            if (req.session.rol==1) {
                const [tipousuario] = await pool.query(
                    `SELECT * FROM tipousuario WHERE idTipoUsuario > 1`, 

                );
            res.render('MedicoControl/Registro.ejs',{tipousuario:tipousuario});
            }else{
                res.redirect('/CerrarSesion')
            }
        });
        

        //Funcio para encontrar dctores y definir a donde van
        this.app.get('/doctores', async (req, res) => {
            try {
                // Selecciona el nombre y apellido de los doctores (rol 2)
                const [doctores] = await pool.query("SELECT idUsers, Nombres, Apellido, Correo FROM users WHERE id_Rol = 2");
                res.json(doctores);
            } catch (error) {
                console.error("Error al obtener doctores:", error);
                res.status(500).send("Error al obtener doctores");
            }
        });

        //Funcion Modal para eleccion dedoctor a consulta
        this.app.post('/notificar-doctor', async (req, res) => {
            try {
                const [doctor] = await pool.query("SELECT Correo FROM users WHERE idUsers = ?", [req.body.doctorId]);
        
                if (!doctor.length) {
                    return res.json({ success: false, message: 'Doctor no encontrado' });
                }
        
                const mailOptions = {
                    from: 'laura.aguilaromero@gmail.com',
                    to: doctor[0].Correo,
                    subject: 'Notificación de Paciente',
                    text: 'Tienes un nuevo paciente a atender'
                };
        
                this.transporter.sendMail(mailOptions, async (error, info) => {
                    if (error) {
                        return res.json({ success: false, message: 'Error al enviar el correo' });
                    }
        
                    console.log('Correo enviado:', info.response);
        
                    // Actualizar base de datos
                    await pool.query("UPDATE historialclinico SET idMedico = ? WHERE idHistorialClinico = ?", [req.body.doctorId, req.body.idHistorialClinico]);
                    await pool.query("UPDATE consultas SET idEstado = 2 WHERE idConsultas = ?", [req.body.idC]);
        
                    return res.json({ success: true, message: 'Notificación enviada correctamente', redirectTo: '/ControlConsulta' });
                });
        
            } catch (error) {
                console.error('Error en notificación:', error);
                return res.json({ success: false, message: 'Hubo un problema en el servidor.' });
            }
        });
        

        //Funcion Aceptacion de la receta para mandarla al paciente
        // Manejar la ruta POST
        this.app.post('/AceptarReceta', async (req, res) => {
            const idCC = req.body.idCC; // Recibiendo el ID del cuerpo de la solicitud
            console.log("ID recibido:", idCC); // Debugging
        
            try {
                // Realiza la actualización en MySQL
                const [cambioC] = await pool.query("UPDATE consultas SET idEstado = 4 WHERE idConsultas = ?", [idCC]);
                
                console.log("Resultado de MySQL:", cambioC);
        
                // Si no se afectaron filas, significa que la consulta no existe
                if (!cambioC.affectedRows) {
                    return res.status(404).json({ error: 'Consulta no encontrada o ya estaba en esa fase.' });
                }
        
                // Actualización en MongoDB
                const CambioMC = await this.ModelConsultas.updateOne(
                    { id: idCC },
                    { $set: { IdEstado: 4 } }
                );
        
                if (CambioMC.modifiedCount === 0) {
                    console.log('No se encontró la consulta con el id proporcionado en MongoDB.');
                }
        
                return res.json({ success: true, redirectTo: '/ControlConsulta' });
        
            } catch (error) {
                console.error('Error al modificar el estado:', error);
                res.status(500).json({ error: 'Hubo un problema al actualizar la consulta.' });
            }
        });
        




        //Funcion Registro de satisfaccion para el paciente despues de la consulta
        this.app.post('/ResultadoSatisfaccion', async (req, res) => {
            const Valor = req.body.valor;
            const idC = req.body.idC;
            const idEstado = req.body.idEstado;

            try {
                if (idEstado == 4) {
                    // Ejecutamos la consulta y desestructuramos la respuesta
                    const [result] = await pool.query(
                        "UPDATE consultas SET idResultado = ?, idEstado = 5 WHERE idConsultas = ?",
                        [Valor, idC]
                    );
                    const CambioMC = await this.ModelConsultas.updateOne(
                        { id: idC }, // Filtro: buscar por idConsultas
                        { $set: { IdEstado: 5,IdResultado:Valor } } // Actualización: cambiar el idEstado
                    );
                    if (CambioMC.nModified === 0) {
                        // Si no se modificó ninguna fila, podemos devolver un mensaje
                        console.log( 'No se encontró la consulta con el id proporcionado.' )
                    }

                    console.log("Resultado de la consulta:", result);

                    // Validamos que la consulta haya afectado filas
                    if (result && (result.affectedRows > 0 || result.changedRows >= 0)) {
                        res.json({ success: true, message: "Receta aceptada", redirectTo: "/HistorialMedico" });
                    } else {
                        res.status(500).json({ success: false, message: "Error en el servidor" });
                    }
                } else {
                    res.status(500).json({ success: false, message: "Error en el servidor" });
                }
            } catch (error) {
                console.error('Error al modificar el estado:', error);
                res.status(500).json({ success: false, message: "Error en el servidor" });
            }
        });

        

        //RUTAS DE MEDICO ESPECIALISTA

        //Ruta Index del medico especilista
        this.app.get('/indexMedico', async(req, res) => {
            if (!req.session.nombre) {
                return res.redirect("/"); // Redirige al login si no hay sesión
            }
            if (req.session.rol==2) {
                const [ConsultaPacientes] = await pool.query("SELECT historialclinico.idHistorialClinico AS idHistorialClinico,historialclinico.idConsulta AS idConsulta,historialclinico.idPaciente AS idPaciente,consultas.Motivo AS Motivo,users.Nombres AS Nombre,users.Apellido AS Apellido FROM historialclinico LEFT JOIN consultas ON historialclinico.idConsulta = consultas.idConsultas LEFT JOIN users ON historialclinico.idPaciente = users.idUsers WHERE  consultas.idEstado = 2 AND historialclinico.idMedico = ?", [req.session.Userid]);
                console.log(ConsultaPacientes)
                res.render('MedicosEspeciales/Consultas.ejs', { 
                    ConsultaPaciente: ConsultaPacientes, 
                    nombre: req.session.nombre // Asegura que nombre esté disponible en la vista
                });
                
            }else{
                res.redirect('/CerrarSesion')
            }
        });

         //Ruta Consulta de registros de quejas sugerencias
        this.app.get('/ContactoMedico', (req, res) => {
            if (!req.session.nombre) {
                return res.redirect("/"); // Redirige al login si no hay sesión
            }
            if (req.session.rol==2) {
            res.render( 'MedicosEspeciales/Contacto.ejs');
            }else{
                res.redirect('/CerrarSesion')
            }
        });

        //Funcion para registrar la receta
        this.app.post('/enviarReceta', async (req, res) => {
            try {
                if (req.session.rol !== 2) {
                    return res.redirect('/CerrarSesion');
                }
        
                const { Tratamiento, Diagnostico, idC, idH } = req.body;
                const currentDate = new Date().toISOString().split('T')[0];
        
                console.log("Datos recibidos:", { Tratamiento, Diagnostico, idC, idH, Fecha: currentDate });
        
                // 🔹 Insertar en MySQL
                const resultado = await pool.query(
                    "INSERT INTO recetas (Diagnostico, Tratamiento, fecha) VALUES (?, ?, ?)", 
                    [Diagnostico, Tratamiento, currentDate]
                );
        
                if (!resultado[0] || !resultado[0].insertId) {
                    throw new Error(" Error al insertar la receta en MySQL.");
                }
        
                const idReceta = resultado[0].insertId;
        
                // 🔹 Actualizar historial y consulta
                const cambioH = await pool.query(
                    "UPDATE historialclinico SET idReceta = ? WHERE idHistorialClinico = ?",
                    [idReceta, idH]
                );
                const cambioC = await pool.query(
                    "UPDATE consultas SET idEstado = 3 WHERE idConsultas = ?",
                    [idC]
                );
        
                if (cambioH[0].affectedRows === 0 || cambioC[0].affectedRows === 0) {
                    throw new Error("Error al actualizar historial clínico o consulta.");
                }
        
                // 🔹 MONGODB: Insertar receta
                const idR = await this.obtenerUltimoRegistro('recetas');  // Asegúrate de que esta función existe
                let Receta = new this.ModelRecetas({
                    id: idR,
                    Diagnostico: Diagnostico,
                    Tratamiento: Tratamiento,
                    Fecha: currentDate
                });
        
                await Receta.save();
                console.log("Receta guardada en MongoDB.");
        
                // 🔹 MONGODB: Actualizar consulta
                const CambioMC = await this.ModelConsultas.updateOne(
                    { id: idC },
                    { $set: { IdEstado: 3 } }
                );
        
                if (CambioMC.matchedCount === 0) {
                    console.warn("No se encontró la consulta con el ID proporcionado.");
                }
        
                //  MONGODB: Actualizar historial clínico
                const CambioMH = await this.ModelHistorialClinico.updateOne(
                    { id: idH },
                    { $set: { idReceta: idR } }
                );
        
                if (CambioMH.matchedCount === 0) {
                    console.warn(" No se encontró el historial clínico con el ID proporcionado.");
                }
        
                res.json({ success: true, message: "Receta registrada con éxito." });
        
            } catch (error) {
                console.error("Error en el servidor:", error);
                res.status(500).json({ success: false, message: "Error interno del servidor." });
            }
        });
        
        //FUncion para ver una consulta en especifico
        this.app.get('/ConsultaP',async (req, res) => {
            if (!req.session.nombre) {
                return res.redirect("/"); // Si no hay sesión, redirige al login
            }
            if (req.session.rol==2) {
                const id = req.query.id;
                console.log(id)
                const [ConsultaPacientes] = await pool.query(
                    `SELECT consultas.*,historialclinico.idHistorialClinico
                     FROM consultas CROSS JOIN historialclinico ON consultas.idConsultas = historialclinico.idConsulta
                     WHERE idConsultas = ?`, 
                    [id]
                );
            res.render('MedicosEspeciales/ConsultaP.ejs',{Consulta:ConsultaPacientes}); 
            }else{
                res.redirect('/CerrarSesion')
            }
        });
        
        //RUTAS DE PACIENTE
        //Ruta de indexdle paciete
        this.app.get('/indexPaciente', (req, res) => {
             // Verificar en la terminal
            if (!req.session.nombre) {
                return res.redirect("/");
            }
            if (req.session.rol == 3) {
                res.render('Pacientes/Consulta.ejs', { nombre: req.session.nombre });
            } else {
                res.redirect('/CerrarSesion');
            }
        });
        

        //Rutas de lel istorial medico
        this.app.get('/HistorialMedico',async (req, res) => {
            if (req.session.rol==3) {
                
                const [ConsultaReceta] = await pool.query("SELECT historialclinico.idHistorialClinico AS idHistorialClinico,historialclinico.idConsulta AS idConsulta,historialclinico.idReceta AS idReceta,consultas.Motivo AS Motivo,consultas.Sintomas AS Sintomas,consultas.idEstado AS idEstado,recetas.Diagnostico AS Diagnostico,recetas.fecha AS Fecha,recetas.Tratamiento AS Tratamiento,consultaestado.Nombre AS Estado FROM historialclinico LEFT JOIN consultas ON historialclinico.idConsulta = consultas.idConsultas LEFT JOIN recetas ON historialclinico.idReceta = recetas.idRecetas LEFT JOIN consultaestado ON consultas.idEstado = consultaestado.idConsultaEstado WHERE historialclinico.idPaciente = ?", [req.session.Userid]);
                console.log(ConsultaReceta[0])
            res.render('Pacientes/HistorialMedico.ejs',{ConsultaReceta:ConsultaReceta});
            }else{
                res.redirect('/CerrarSesion')
            }
        });
        //RUta de sugerencias en paciente
        this.app.get('/ContactoPaciente', (req, res) => {
            if (req.session.rol==3) {
            res.render('Pacientes/Contacto.ejs');
            }else{
                res.redirect('/CerrarSesion')
            }
        });

        //FUncion para registrar usuarios
        this.app.post('/registrar', async (req, res) => {
            try {
                
                const { nombre, apellido, email, fecha_nacimiento, genero, role } = req.body;
                const [resultados] = await pool.query("SELECT COUNT(*) as count FROM users WHERE Correo = ?", [email]);
                if (resultados[0].count > 0) {
                    return res.status(400).json({ 
                        success: false,
                        message: 'El correo ya está registrado',
                        errorCode: 'EMAIL_EXISTS' 
                    });
                  } 
                
                // 1. Generar contraseña
                const password = Array.from({length: 6}, () => 
                    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'[
                        Math.floor(Math.random() * 62)
                    ]).join('');
                
                // 2. Hash de contraseña
                const salt = await bcrypt.genSalt(6);
                const hashCont = await bcrypt.hash(password, salt);
        
                // 3. Obtener último ID (solo si usas MySQL)
                const [lastId] = await pool.query("SELECT MAX(idUsers) as lastId FROM Users");
                const newId = lastId[0].lastId ? lastId[0].lastId + 1 : 1;
        
                // 4. Guardar en MongoDB
                const newUser = new this.ModelUsuarios({
                    id: newId,
                    correo: email,
                    Password: hashCont,
                    Nombres: nombre,
                    Apellido: apellido,
                    Genero: genero,
                    fecha_nacimiento: fecha_nacimiento,
                    id_Rol: role
                });
                await newUser.save();
        
                // 5. Guardar en MySQL (opcional, escoge solo una base de datos)
                const [result] = await pool.query(
                    "INSERT INTO Users SET ?", 
                    {
                        Nombres: nombre,
                        Apellido: apellido,
                        fecha_nacimiento: fecha_nacimiento,
                        Genero: genero,
                        Correo: email,
                        id_Rol: role,
                        Password: hashCont
                    }
                );
        
                // 6. Enviar correo
                await this.transporter.sendMail({
                    from: 'laura.aguilaromero@gmail.com',
                    to: email,
                    subject: 'Bienvenido a S.A.M',
                    text: `Hola ${nombre}, tu contraseña temporal es: ${password}`
                });
        
                // 7. Obtener tipos de usuario para volver a mostrar el formulario
                const [tipousuario] = await pool.query("SELECT * FROM tipousuario WHERE idTipoUsuario > 1");
                
                 res.json({ 
                    success: true,
                    message: 'Usuario registrado exitosamente',
                    
                        }); 
            } catch (error) {

                // Obtener tipos de usuario incluso en caso de error
                const [tipousuario] = await pool.query("SELECT * FROM tipousuario WHERE idTipoUsuario > 1");
                            
                            res.json({ 
                        success: true,
                        message: 'Error, no se registro el usuario',
                        
                            });
                        
            }
        });

    //FUncion para registrar sugerencias
    this.app.post('/Sugerir', async (req, res) => {
        try {
            console.log("Datos recibidos:", req.body);
            let Motivo=req.body.Motivo;
            let Descripcion=req.body.Descripcion;
            let sugerencia = new this.ModelSugerencia({
                Motivo:Motivo,
                Descripcion:Descripcion
            });

            await sugerencia.save();
            switch (req.session.rol) {
                case 1:
                    return res.redirect('/ContactoControl');
                case 2:
                    return res.redirect('/ContactoMedico');
                case 3:
                    return res.redirect('/ContactoPaciente');
                default:
                    return res.status(400).send('Rol no válido');
            }
        } catch (error) {
            console.error("Error al guardar la sugerencia:", error);
            res.status(500).send("Error interno del servidor");
        }
    });


        //Registro de consulta
        this.app.post('/ConsultaRegistro', async(req,res)=>{
            let idPaciente=req.session.Userid;
            let motivo=req.body.motivo;
            let sintomas=req.body.sintomas;
            let alergias=req.body.alergias;
            let cirugias=req.body.cirugias;
            let hospitalizaciones=req.body.hospitalizaciones;
            let tabaco=req.body.tabaco;
            let alcohol=req.body.alcohol;
            let direccion=req.body.direccion;
            let Estado=1
            console.log(idPaciente,motivo,sintomas,alergias,cirugias,hospitalizaciones,tabaco,alcohol,direccion,Estado)

                
                

            const idC=await this.obtenerUltimoRegistro('consultas');
            let Consulta = new this.ModelConsultas({
                id: idC,
                Motivo: motivo,
                Sintomas: sintomas,
                Alergias: alergias,
                CirugiasPrevias: cirugias,
                HospitalizacionesPrevias: hospitalizaciones,
                ConsumoTabaco: tabaco,
                ConsumoAlcohol: alcohol,
                Direccion: direccion,
                IdEstado:Estado,
                IdResultado:0
            });
        
            const idH=await this.obtenerUltimoRegistro('historialclinicos');
            let historial = new this.ModelHistorialClinico({
                id: idH,
                idConsulta: idC,
                idReceta:0,
                idPaciente: idPaciente,
                idMedico: 0,
            });
            await Consulta.save();
            await historial.save();

                
                
            const resultado=await pool.query("INSERT INTO consultas (Motivo,Sintomas,Alergias,CirugiasPrevias,HospitalizacionesPrevias,ConsumoTabaco,ConsumoAlcohol,Direccion,idEstado)"+"VALUES (?,?,?,?,?,?,?,?,?)",[motivo,sintomas,alergias,cirugias,hospitalizaciones,tabaco,alcohol,direccion,Estado]);
            const idConsulta = resultado[0].insertId; 
            const historialclinico=await pool.query("INSERT INTO historialclinico (idConsulta,idPaciente)"+"VALUES (?,?)",[idConsulta,idPaciente]);

            console.log(resultado)
            console.log(historialclinico)
            if (resultado[0].affectedRows > 0 && historialclinico[0].affectedRows > 0) {
                res.render('Pacientes/Consulta.ejs');
            } else {
                console.log('Error al registrar el usuario');
                res.status(500).send('Error al registrar el usuario'    );
            }
                
        })

        
    }

    async listen() {
        if (process.env.NODE_ENV === 'test') {
            console.log('Modo test: no se inicia el servidor real.');
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            this.app.listen(this.port, () => {
            console.log(`Servidor escuchando en puerto ${this.port}`);
            resolve();
            }).on('error', reject);
        });
        }

}

module.exports = Server;