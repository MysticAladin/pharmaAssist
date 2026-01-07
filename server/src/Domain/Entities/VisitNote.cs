using Domain.Enums;

namespace Domain.Entities;

/// <summary>
/// Notes recorded during a visit
/// </summary>
public class VisitNote : BaseEntity
{
    /// <summary>
    /// FK to the executed visit
    /// </summary>
    public int VisitId { get; set; }
    
    /// <summary>
    /// Type/category of the note
    /// </summary>
    public VisitNoteType NoteType { get; set; }
    
    /// <summary>
    /// Content of the note
    /// </summary>
    public string NoteText { get; set; } = string.Empty;
    
    // Navigation properties
    
    /// <summary>
    /// The executed visit this note belongs to
    /// </summary>
    public virtual ExecutedVisit? Visit { get; set; }
}
