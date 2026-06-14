const major = Number(process.versions.node.split(".")[0])

if (major < 20 || major >= 23) {
  console.error(
    [
      `Unsupported Node.js ${process.version}.`,
      "Medusa 2 in this project should run on Node 20 LTS.",
      "Run: nvm use 20.19.1",
    ].join("\n")
  )
  process.exit(1)
}
