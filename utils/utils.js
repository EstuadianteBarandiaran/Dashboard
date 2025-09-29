async function obtenerUltimoRegistro(nombreColeccion) {
    try {
        const coleccion = mongoose.connection.collection(nombreColeccion); // Usa la conexión existente
        const ultimoRegistro = await coleccion.find().sort({ _id: -1 }).limit(1).toArray();
        return ultimoRegistro.length > 0 ? ultimoRegistro[0] : null;
    } catch (error) {
        console.error("Error al obtener el último registro:", error);
        return null;
    }
}

module.exports = { obtenerUltimoRegistro };